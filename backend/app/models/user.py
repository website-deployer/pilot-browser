"""
User model for the Pilot Browser application.

This module defines the User model and related Pydantic schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base

# SQLAlchemy Model
class User(Base):
    """User model for database"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    full_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<User {self.username}>"

# Pydantic Models
class UserBase(BaseModel):
    """Base user model"""
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False
    
    class Config:
        orm_mode = True

class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def password_complexity(cls, v):
        """Validate password complexity"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

class UserUpdate(BaseModel):
    """User update model"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    
    @validator('password')
    def password_complexity(cls, v):
        """Validate password complexity if provided"""
        if v is not None:
            if len(v) < 8:
                raise ValueError('Password must be at least 8 characters long')
            if not any(c.isupper() for c in v):
                raise ValueError('Password must contain at least one uppercase letter')
            if not any(c.islower() for c in v):
                raise ValueError('Password must contain at least one lowercase letter')
            if not any(c.isdigit() for c in v):
                raise ValueError('Password must contain at least one number')
        return v

class UserInDB(UserBase):
    """User model for database operations"""
    id: int
    hashed_password: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class UserResponse(UserBase):
    """User response model (excludes sensitive data)"""
    id: int
    created_at: datetime
    updated_at: datetime

# Export models
__all__ = [
    'User', 'UserBase', 'UserCreate', 'UserUpdate', 'UserInDB', 'UserResponse'
]
