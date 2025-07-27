"""
Configuration settings for the Pilot Browser backend.

This module loads configuration from environment variables with sensible defaults.
"""
import os
from pydantic import BaseSettings, AnyHttpUrl, validator
from typing import List, Optional, Union
from dotenv import load_dotenv
import secrets

# Load environment variables from .env file if it exists
load_dotenv()

class Settings(BaseSettings):
    """Application settings"""
    # Application
    APP_NAME: str = "Pilot Browser"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENV", "development")
    
    # API
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS origins"""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./pilot_browser.db"
    )
    
    # LLM
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4")
    
    # Search
    SEARCH_PROVIDERS: List[str] = [
        "google", "bing", "duckduckgo"
    ]
    
    # Security
    SECURE_COOKIES: bool = os.getenv("SECURE_COOKIES", "true").lower() == "true"
    SESSION_COOKIE_NAME: str = "pilot_session"
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        """Pydantic config"""
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

# Create settings instance
settings = Settings()

# Export settings
__all__ = ["settings"]
