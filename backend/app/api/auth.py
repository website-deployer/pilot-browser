"""
Authentication endpoints for the Pilot Browser API.

This module handles user authentication, token generation, and user management.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import logging

from app.core.database import get_db
from app.models.user import User, UserCreate, UserInDB
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Token models
class Token(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Token data model"""
    username: Optional[str] = None

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash"""
    return pwd_context.hash(password)

async def get_user(username: str) -> Optional[UserInDB]:
    """Get user by username"""
    async with get_db() as db:
        user = await db.get(User, username)
        if user:
            return UserInDB(**user.dict())
    return None

async def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    """Authenticate a user"""
    user = await get_user(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

# Routes
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible token login"""
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    
    logger.info(f"User {user.username} logged in successfully")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """Register a new user"""
    db_user = await get_user(user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    db_user = UserInDB(
        **user.dict(exclude={"password"}),
        hashed_password=hashed_password,
        is_active=True
    )
    
    async with get_db() as db:
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
    
    logger.info(f"New user registered: {user.username}")
    return db_user

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# Dependency to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get the current user from the token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await get_user(token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Dependency to get current active user
async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
