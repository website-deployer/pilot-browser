"""
Credential model for securely storing user credentials.

This module defines the Credential model for storing encrypted credentials
for various services that the Pilot Browser interacts with.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.user import User

class Credential(Base):
    """Credential model for database"""
    __tablename__ = "credentials"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    service_name = Column(String(100), nullable=False)  # e.g., 'google', 'github', 'aws'
    credential_name = Column(String(100), nullable=False)  # User-defined name for the credential
    encrypted_credentials = Column(Text, nullable=False)  # Encrypted JSON string of credentials
    metadata_ = Column("metadata", JSON, default={})  # Additional metadata (non-sensitive)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="credentials")
    
    def __repr__(self):
        return f"<Credential {self.service_name} for user {self.user_id}>"

# Pydantic Models
class CredentialBase(BaseModel):
    """Base credential model"""
    service_name: str = Field(..., min_length=2, max_length=100)
    credential_name: str = Field(..., min_length=2, max_length=100)
    metadata: Dict[str, Any] = {}
    
    class Config:
        orm_mode = True

class CredentialCreate(CredentialBase):
    """Credential creation model"""
    # This will be encrypted before storage
    credentials: Dict[str, Any]
    
    @validator('service_name', 'credential_name')
    def validate_name_chars(cls, v):
        """Validate name contains only allowed characters"""
        import re
        if not re.match(r'^[a-zA-Z0-9_\-\s]+$', v):
            raise ValueError('Name can only contain letters, numbers, spaces, underscores, and hyphens')
        return v.strip()

class CredentialUpdate(BaseModel):
    """Credential update model"""
    credential_name: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('credential_name')
    def validate_name_chars(cls, v):
        """Validate name contains only allowed characters if provided"""
        if v is not None:
            import re
            if not re.match(r'^[a-zA-Z0-9_\-\s]+$', v):
                raise ValueError('Name can only contain letters, numbers, spaces, underscores, and hyphens')
            return v.strip()
        return v

class CredentialInDB(CredentialBase):
    """Credential model for database operations"""
    id: int
    user_id: int
    encrypted_credentials: str  # Encrypted JSON string
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class CredentialResponse(CredentialBase):
    """Credential response model (excludes encrypted data)"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

# Add relationship to User model
User.credentials = relationship("Credential", back_populates="user", cascade="all, delete-orphan")

# Export models
__all__ = [
    'Credential', 'CredentialBase', 'CredentialCreate', 'CredentialUpdate',
    'CredentialInDB', 'CredentialResponse'
]
