"""
Agent Mode endpoints for the Pilot Browser API.

This module defines the API endpoints for the Agent Mode functionality,
which enables multi-agent task automation.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
from datetime import datetime

from app.core.database import get_db
from app.models.task import (
    Task, TaskCreate, TaskResponse, TaskStatus, TaskType
)
from app.services.agent_service import AgentService
from app.api.auth import get_current_active_user, User

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/agent", tags=["agent"])

# Initialize agent service
agent_service = AgentService()

@router.post("/tasks/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_agent_task(
    task_data: TaskCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new agent task.
    """
    try:
        # Create task in database
        db_task = Task(
            user_id=current_user.id,
            title=task_data.title,
            description=task_data.description,
            task_type=task_data.task_type or TaskType.AUTOMATION,
            parameters=task_data.parameters,
            metadata_=task_data.metadata
        )
        
        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        
        # Start the task in the background
        background_tasks.add_task(
            process_agent_task,
            task_id=db_task.id,
            user_id=current_user.id,
            parameters=task_data.parameters
        )
        
        logger.info(f"Created new agent task: {db_task.id}")
        return db_task
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating agent task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create agent task"
        )

@router.get("/tasks/", response_model=List[TaskResponse])
async def list_agent_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[TaskStatus] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List agent tasks for the current user.
    """
    try:
        from sqlalchemy import and_
        conditions = [Task.user_id == current_user.id]
        if status:
            conditions.append(Task.status == status)

        result = await db.execute(
            select(Task)
            .where(and_(*conditions))
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
        
    except Exception as e:
        logger.error(f"Error listing agent tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list agent tasks"
        )

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_agent_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific agent task.
    """
    try:
        result = await db.execute(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == current_user.id)
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
            
        return task
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent task"
        )

@router.post("/execute", status_code=status.HTTP_200_OK)
async def execute_script(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """
    Execute a provided Playwright script.
    """
    try:
        code = payload.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="Code is required")
        
        from app.services.executor_service import execute_playwright_script
        result = await execute_playwright_script(code)
        return result
    except Exception as e:
        logger.error(f"Execution error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_agent_task(task_id: int, user_id: int, parameters: Dict[str, Any], resume_info: Optional[str] = None):
    """
    Background task to process an agent task.
    """
    try:
        await agent_service.execute_task(
            task_id=task_id,
            user_id=user_id,
            task_type="automation",
            parameters=parameters,
            resume_info=resume_info
        )
    except Exception as e:
        logger.error(f"Error in process_agent_task {task_id}: {str(e)}")
