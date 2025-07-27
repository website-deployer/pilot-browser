"""
Credential endpoints for the Pilot Browser API.

This module defines the API endpoints for managing user credentials securely.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.core.database import get_db
from app.models.credential import (
    Credential, CredentialCreate, CredentialUpdate, CredentialResponse,
    CredentialInDB
)
from app.core.security import (
    encrypt_credentials, decrypt_credentials, get_password_hash,
    verify_password, create_access_token, get_current_user
)
from app.models.user import User

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Security scheme
security = HTTPBearer()

# Routes
@router.post("/", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
async def create_credential(
    credential: CredentialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new credential entry.
    
    The provided credentials will be encrypted before storage.
    """
    try:
        from sqlalchemy import select
        
        # Check if credential with same name already exists for this user and service
        existing = await db.execute(
            select(Credential)
            .where(Credential.user_id == current_user.id)
            .where(Credential.service_name == credential.service_name)
            .where(Credential.credential_name == credential.credential_name)
        )
        
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A credential with this name already exists for the specified service"
            )
        
        # Encrypt the credentials
        encrypted_creds = encrypt_credentials(
            credential.credentials,
            current_user.id
        )
        
        # Create credential in database
        db_credential = Credential(
            user_id=current_user.id,
            service_name=credential.service_name,
            credential_name=credential.credential_name,
            encrypted_credentials=encrypted_creds,
            metadata_=credential.metadata
        )
        
        db.add(db_credential)
        await db.commit()
        await db.refresh(db_credential)
        
        logger.info(f"Created credential {db_credential.id} for user {current_user.id}")
        return db_credential
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating credential: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create credential"
        )

@router.get("/", response_model=List[CredentialResponse])
async def list_credentials(
    service_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List credentials for the current user.
    
    Optionally filter by service name.
    """
    try:
        from sqlalchemy import select, and_
        
        # Build query
        conditions = [Credential.user_id == current_user.id]
        if service_name:
            conditions.append(Credential.service_name == service_name)
        
        # Get credentials from database
        result = await db.execute(
            select(Credential)
            .where(and_(*conditions))
            .order_by(Credential.service_name, Credential.credential_name)
        )
        
        credentials = result.scalars().all()
        
        # Don't include encrypted data in the response
        for cred in credentials:
            cred.encrypted_credentials = "[ENCRYPTED]"
        
        return credentials
        
    except Exception as e:
        logger.error(f"Error listing credentials: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve credentials"
        )

@router.get("/{credential_id}", response_model=CredentialResponse)
async def get_credential(
    credential_id: int,
    include_secrets: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific credential by ID.
    
    By default, the encrypted credentials are not included in the response.
    Set include_secrets=true to include the decrypted credentials.
    """
    try:
        from sqlalchemy import select
        
        # Get credential from database
        result = await db.execute(
            select(Credential)
            .where(Credential.id == credential_id)
            .where(Credential.user_id == current_user.id)
        )
        
        credential = result.scalar_one_or_none()
        
        if credential is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found or access denied"
            )
        
        # Prepare response
        response = CredentialResponse.from_orm(credential)
        
        # Only include decrypted credentials if explicitly requested
        if include_secrets:
            try:
                decrypted = decrypt_credentials(
                    credential.encrypted_credentials,
                    current_user.id
                )
                response.credentials = decrypted
            except Exception as e:
                logger.error(f"Error decrypting credentials: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to decrypt credentials"
                )
        else:
            response.encrypted_credentials = "[ENCRYPTED]"
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving credential {credential_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve credential"
        )

@router.patch("/{credential_id}", response_model=CredentialResponse)
async def update_credential(
    credential_id: int,
    credential_update: CredentialUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a credential.
    
    Only the provided fields will be updated.
    """
    try:
        from sqlalchemy import select
        
        # Get credential from database
        result = await db.execute(
            select(Credential)
            .where(Credential.id == credential_id)
            .where(Credential.user_id == current_user.id)
        )
        
        credential = result.scalar_one_or_none()
        
        if credential is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found or access denied"
            )
        
        # Update fields
        update_data = credential_update.dict(exclude_unset=True)
        
        # Handle credential updates (re-encrypt if needed)
        if 'credentials' in update_data:
            update_data['encrypted_credentials'] = encrypt_credentials(
                update_data.pop('credentials'),
                current_user.id
            )
        
        # Apply updates
        for field, value in update_data.items():
            setattr(credential, field, value)
        
        await db.commit()
        await db.refresh(credential)
        
        logger.info(f"Updated credential {credential_id} for user {current_user.id}")
        
        # Don't include encrypted data in the response
        credential.encrypted_credentials = "[ENCRYPTED]"
        return credential
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating credential {credential_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update credential"
        )

@router.delete("/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credential(
    credential_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a credential.
    
    Permanently deletes the specified credential.
    """
    try:
        from sqlalchemy import select, delete
        
        # Check if credential exists and belongs to user
        result = await db.execute(
            select(Credential)
            .where(Credential.id == credential_id)
            .where(Credential.user_id == current_user.id)
        )
        
        credential = result.scalar_one_or_none()
        
        if credential is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found or access denied"
            )
        
        # Delete credential
        await db.execute(
            delete(Credential)
            .where(Credential.id == credential_id)
        )
        
        await db.commit()
        
        logger.info(f"Deleted credential {credential_id} for user {current_user.id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting credential {credential_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete credential"
        )
