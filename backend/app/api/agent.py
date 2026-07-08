"""
Agent Mode endpoints for the Pilot Browser API.

This module defines the API endpoints for the Agent Mode functionality,
which enables multi-agent task automation.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from fastapi.responses import JSONResponse
import logging
import uuid
from datetime import datetime

from app.core.config import settings
from app.models.agent import (
    AgentTask,
    AgentTaskCreate,
    AgentTaskUpdate,
    AgentTaskStatus,
    AgentType,
    AgentTaskResult,
    AgentTaskStep
)
from app.services.agent_service import AgentService
from app.api.auth import get_current_active_user, User
from app.core.database import get_db

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["agent"])

from sqlalchemy.ext.asyncio import AsyncSession

# Initialize agent service
agent_service = AgentService()

@router.post("/tasks/", response_model=AgentTask, status_code=status.HTTP_201_CREATED)
async def create_agent_task(
    task_data: AgentTaskCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new agent task.
    
    This endpoint creates a new task for the agent system to process.
    The task will be processed asynchronously.
    """
    try:
        from app.models.task import Task, TaskType
        # Create a new task in DB
        db_task = Task(
            user_id=current_user.id,
            title=task_data.title,
            description=task_data.description,
            status=AgentTaskStatus.PENDING,
            task_type=TaskType.AUTOMATION,
            parameters=task_data.input_data
        )
        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        
        task_id = str(db_task.id)
        
        # Start the task in the background
        background_tasks.add_task(
            process_agent_task,
            task_id=task_id,
            task_data=task_data
        )
        
        logger.info(f"Created new agent task: {task_id}")
        # Convert DB task to AgentTask model
        return AgentTask(
            id=task_id,
            user_id=str(current_user.id),
            title=db_task.title,
            description=db_task.description,
            status=db_task.status,
            agent_type=task_data.agent_type,
            input_data=db_task.parameters,
            created_at=db_task.created_at,
            updated_at=db_task.updated_at
        )
        
    except Exception as e:
        logger.error(f"Error creating agent task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create agent task"
        )

@router.get("/tasks/", response_model=List[AgentTask])
async def list_agent_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[AgentTaskStatus] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List agent tasks for the current user.
    """
    try:
        from app.models.task import Task
        from sqlalchemy import select
        query = select(Task).where(Task.user_id == current_user.id)
        if status:
            query = query.where(Task.status == status)
        
        result = await db.execute(query.offset(skip).limit(limit))
        db_tasks = result.scalars().all()

        return [
            AgentTask(
                id=str(t.id),
                user_id=str(t.user_id),
                title=t.title,
                description=t.description,
                status=t.status,
                agent_type=AgentType.ORCHESTRATOR,
                input_data=t.parameters,
                created_at=t.created_at,
                updated_at=t.updated_at
            ) for t in db_tasks
        ]
        
    except Exception as e:
        logger.error(f"Error listing agent tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list agent tasks"
        )

@router.get("/tasks/{task_id}", response_model=AgentTask)
async def get_agent_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific agent task.
    """
    try:
        from app.models.task import Task
        db_task = await db.get(Task, int(task_id))
        
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        if db_task.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        return AgentTask(
            id=str(db_task.id),
            user_id=str(db_task.user_id),
            title=db_task.title,
            description=db_task.description,
            status=db_task.status,
            agent_type=AgentType.ORCHESTRATOR,
            input_data=db_task.parameters,
            result=AgentTaskResult(success=True, output=db_task.result) if db_task.result else None,
            created_at=db_task.created_at,
            updated_at=db_task.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent task"
        )

@router.put("/tasks/{task_id}", response_model=AgentTask)
async def update_agent_task(
    task_id: str,
    task_update: AgentTaskUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing agent task.
    """
    try:
        from app.models.task import Task
        db_task = await db.get(Task, int(task_id))
        
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        if db_task.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        if task_update.title is not None:
            db_task.title = task_update.title
        if task_update.description is not None:
            db_task.description = task_update.description
        if task_update.status is not None:
            db_task.status = task_update.status
            
        db_task.updated_at = datetime.utcnow()
        
        if task_update.input_data and "answer" in task_update.input_data:
            background_tasks.add_task(
                process_agent_task,
                task_id=task_id,
                task_data=None,
                resume_info=task_update.input_data["answer"]
            )

        await db.commit()
        await db.refresh(db_task)
        
        return AgentTask(
            id=str(db_task.id),
            user_id=str(db_task.user_id),
            title=db_task.title,
            description=db_task.description,
            status=db_task.status,
            agent_type=AgentType.ORCHESTRATOR,
            input_data=db_task.parameters,
            created_at=db_task.created_at,
            updated_at=db_task.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating agent task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update agent task"
        )

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an agent task.
    """
    try:
        from app.models.task import Task
        db_task = await db.get(Task, int(task_id))
        
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        if db_task.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        if db_task.status == AgentTaskStatus.RUNNING:
            raise HTTPException(status_code=400, detail="Cannot delete a running task")
            
        await db.delete(db_task)
        await db.commit()
        
        logger.info(f"Deleted agent task: {task_id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting agent task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete agent task"
        )

from pydantic import BaseModel
class ExecuteRequest(BaseModel):
    code: str

@router.post("/execute")
async def execute_script(
    request: ExecuteRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Execute a Playwright script.

    This endpoint allows users to manually run scripts generated by the agents.
    """
    try:
        from app.services.executor_service import execute_playwright_script
        logger.info(f"User {current_user.id} triggered script execution")
        result = execute_playwright_script(request.code)
        return result
    except Exception as e:
        logger.error(f"Execution error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Execution failed: {str(e)}"
        )

@router.post("/tasks/{task_id}/cancel", response_model=AgentTask)
async def cancel_agent_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a running agent task.
    """
    try:
        from app.models.task import Task
        db_task = await db.get(Task, int(task_id))
        
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        if db_task.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        if db_task.status != AgentTaskStatus.RUNNING:
            raise HTTPException(status_code=400, detail="Only running tasks can be canceled")
            
        db_task.status = AgentTaskStatus.CANCELED
        db_task.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(db_task)
        
        logger.info(f"Canceled agent task: {task_id}")
        return AgentTask(
            id=str(db_task.id),
            user_id=str(db_task.user_id),
            title=db_task.title,
            description=db_task.description,
            status=db_task.status,
            agent_type=AgentType.ORCHESTRATOR,
            input_data=db_task.parameters,
            created_at=db_task.created_at,
            updated_at=db_task.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling agent task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel agent task"
        )

from app.core.database import get_db_cm

async def process_agent_task(task_id: str, task_data: Optional[AgentTaskCreate] = None, resume_info: Optional[str] = None):
    """
    Background task to process an agent task.
    """
    from app.models.task import Task
    async with get_db_cm() as db:
        db_task = await db.get(Task, int(task_id))
        if not db_task:
            logger.error(f"Task {task_id} not found in DB")
            return
            
        db_task.status = AgentTaskStatus.RUNNING
        db_task.updated_at = datetime.utcnow()
        await db.commit()
        
        try:
            # Use the orchestrator for all tasks now
            result = await agent_service.execute_task(
                task_id=task_id,
                user_id=db_task.user_id,
                task_type="orchestrator",
                parameters=db_task.parameters,
                resume_info=resume_info
            )
                
            db_task.result = result.get("results")
            if result.get("status") == "pending":
                db_task.status = AgentTaskStatus.PENDING
            elif result.get("status") == "failed":
                db_task.status = AgentTaskStatus.FAILED
            elif result.get("status") == "completed":
                db_task.status = AgentTaskStatus.COMPLETED
            else:
                # Default to failed if status is missing/unknown
                db_task.status = AgentTaskStatus.FAILED
            
        except Exception as e:
            # Handle errors during task processing
            logger.error(f"Error processing task {task_id}: {str(e)}")
            db_task.status = AgentTaskStatus.FAILED
            db_task.error = str(e)
            
        db_task.updated_at = datetime.utcnow()
        await db.commit()
