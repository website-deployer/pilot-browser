"""
Task endpoints for the Pilot Browser API.

This module defines the API endpoints for managing tasks in the Pilot Browser.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.core.database import get_db
from app.models.task import (
    Task, TaskCreate, TaskUpdate, TaskResponse, TaskStatus, TaskType
)
from app.services.agent_service import AgentService
from app.api.auth import get_current_active_user, User

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize agent service
agent_service = AgentService()

# Helper function to run tasks in the background
async def run_task_in_background(
    task_id: int,
    user_id: int,
    task_type: TaskType,
    parameters: dict
):
    """Run a task in the background using the agent service"""
    try:
        # Initialize agent service if not already initialized
        if not agent_service.initialized:
            await agent_service.initialize()
        
        # Execute the task
        await agent_service.execute_task(task_id, user_id, task_type, parameters)
        
    except Exception as e:
        logger.error(f"Background task execution failed: {str(e)}", exc_info=True)

# Routes
@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new task.
    
    This endpoint creates a new task and starts its execution in the background.
    """
    try:
        # Create task in database
        db_task = Task(
            user_id=current_user.id,
            title=task.title,
            description=task.description,
            task_type=task.task_type,
            parameters=task.parameters,
            metadata_=task.metadata
        )
        
        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        
        # Start task execution in background
        background_tasks.add_task(
            run_task_in_background,
            task_id=db_task.id,
            user_id=current_user.id,
            task_type=task.task_type,
            parameters=task.parameters
        )
        
        logger.info(f"Created and started task {db_task.id} for user {current_user.id}")
        return db_task
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating task: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task"
        )

@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[TaskStatus] = None,
    task_type: Optional[TaskType] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List tasks for the current user.
    
    Returns a paginated list of tasks, optionally filtered by status and/or type.
    """
    try:
        from sqlalchemy import select
        from sqlalchemy.sql import and_
        
        # Build filter conditions
        conditions = [Task.user_id == current_user.id]
        if status:
            conditions.append(Task.status == status)
        if task_type:
            conditions.append(Task.task_type == task_type)
        
        # Query tasks
        result = await db.execute(
            select(Task)
            .where(and_(*conditions))
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        
        tasks = result.scalars().all()
        return tasks
        
    except Exception as e:
        logger.error(f"Error listing tasks: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tasks"
        )

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific task by ID.
    
    Returns the task details if the current user has access to it.
    """
    try:
        from sqlalchemy import select
        
        # Get task from database
        result = await db.execute(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == current_user.id)
        )
        
        task = result.scalar_one_or_none()
        
        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or access denied"
            )
        
        return task
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving task {task_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve task"
        )

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a task.
    
    Allows updating task details such as status, result, or metadata.
    """
    try:
        from sqlalchemy import select
        
        # Get task from database
        result = await db.execute(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == current_user.id)
        )
        
        task = result.scalar_one_or_none()
        
        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or access denied"
            )
        
        # Update task fields
        update_data = task_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        
        await db.commit()
        await db.refresh(task)
        
        logger.info(f"Updated task {task_id} for user {current_user.id}")
        return task
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating task {task_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task"
        )

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a task.
    
    Permanently deletes the specified task if the current user has permission.
    """
    try:
        from sqlalchemy import select, delete
        
        # Check if task exists and belongs to user
        result = await db.execute(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == current_user.id)
        )
        
        task = result.scalar_one_or_none()
        
        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or access denied"
            )
        
        # Delete task
        await db.execute(
            delete(Task)
            .where(Task.id == task_id)
        )
        
        await db.commit()
        
        logger.info(f"Deleted task {task_id} for user {current_user.id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting task {task_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task"
        )

@router.post("/{task_id}/cancel", response_model=TaskResponse)
async def cancel_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a running task.
    
    Attempts to cancel a task that is currently in progress.
    """
    try:
        from sqlalchemy import select
        
        # Get task from database
        result = await db.execute(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == current_user.id)
        )
        
        task = result.scalar_one_or_none()
        
        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or access denied"
            )
        
        # Check if task can be cancelled
        if task.status not in [TaskStatus.PENDING, TaskStatus.RUNNING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Task cannot be cancelled in its current state: {task.status}"
            )
        
        # Update task status to cancelled
        task.status = TaskStatus.CANCELLED
        task.error = "Task was cancelled by user"
        
        await db.commit()
        await db.refresh(task)
        
        # TODO: Implement actual task cancellation logic
        # This would involve stopping any running background tasks or processes
        
        logger.info(f"Cancelled task {task_id} for user {current_user.id}")
        return task
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error cancelling task {task_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel task"
        )
