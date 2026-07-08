import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings
from cryptography.fernet import Fernet
import base64

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def encrypt_credentials(data: Dict[str, Any], user_id: int) -> str:
    # Simplified encryption for development
    # In production, use a more robust key management system
    key = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].ljust(32).encode())
    f = Fernet(key)
    return f.encrypt(str(data).encode()).decode()

def decrypt_credentials(encrypted_data: str, user_id: int) -> Dict[str, Any]:
    key = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].ljust(32).encode())
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_data.encode()).decode()
    # In a real app, use json.loads
    import ast
    return ast.literal_eval(decrypted)

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.api.auth import get_current_user as get_user_from_auth

async def get_current_user(token: str):
    """Bridge to the main get_current_user logic"""
    return await get_user_from_auth(token)
