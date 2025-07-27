"""
Task model for the Pilot Browser application.

This module defines the Task model for managing automation tasks.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.user import User

class TaskStatus(str, Enum):
    """Task status enum"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TaskType(str, Enum):
    """Task type enum"""
    SEARCH = "search"
    AUTOMATION = "automation"
    DATA_EXTRACTION = "data_extraction"
    OTHER = "other"

class Task(Base):
    """Task model for database"""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(SQLEnum(TaskType), default=TaskType.OTHER, nullable=False)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    parameters = Column(JSON, default={})  # Input parameters for the task
    result = Column(JSON, default={})  # Task results
    error = Column(Text, nullable=True)  # Error message if task failed
    metadata_ = Column("metadata", JSON, default={})  # Additional metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    
    def __repr__(self):
        return f"<Task {self.title} ({self.status})>"

# Pydantic Models
class TaskBase(BaseModel):
    """Base task model"""
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    task_type: TaskType = TaskType.OTHER
    parameters: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}
    
    class Config:
        orm_mode = True
        use_enum_values = True

class TaskCreate(TaskBase):
    """Task creation model"""
    pass

class TaskUpdate(BaseModel):
    """Task update model"""
    status: Optional[TaskStatus] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        use_enum_values = True

class TaskInDB(TaskBase):
    """Task model for database operations"""
    id: int
    user_id: int
    status: TaskStatus
    result: Dict[str, Any]
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True
        use_enum_values = True

class TaskResponse(TaskInDB):
    """Task response model"""
    pass

# Add relationship to User model
User.tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")

# Export models and enums
__all__ = [
    'TaskStatus', 'TaskType', 'Task', 'TaskBase', 'TaskCreate', 'TaskUpdate',
    'TaskInDB', 'TaskResponse'
]
