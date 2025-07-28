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

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/agent", tags=["agent"])

# Initialize agent service
agent_service = AgentService()

# In-memory task store (in a real app, this would be a database)
task_store: Dict[str, AgentTask] = {}

@router.post("/tasks/", response_model=AgentTask, status_code=status.HTTP_201_CREATED)
async def create_agent_task(
    task_data: AgentTaskCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new agent task.
    
    This endpoint creates a new task for the agent system to process.
    The task will be processed asynchronously.
    """
    try:
        # Create a new task
        task_id = str(uuid.uuid4())
        task = AgentTask(
            id=task_id,
            user_id=current_user.id,
            title=task_data.title,
            description=task_data.description,
            status=AgentTaskStatus.PENDING,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            agent_type=task_data.agent_type,
            input_data=task_data.input_data,
            steps=[],
            result=None
        )
        
        # Store the task
        task_store[task_id] = task
        
        # Start the task in the background
        background_tasks.add_task(
            process_agent_task,
            task_id=task_id,
            task_data=task_data
        )
        
        logger.info(f"Created new agent task: {task_id}")
        return task
        
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
    agent_type: Optional[AgentType] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    List agent tasks for the current user.
    
    Returns a paginated list of agent tasks, optionally filtered by status and agent type.
    """
    try:
        # Filter tasks by user and optional filters
        tasks = [
            task for task in task_store.values()
            if task.user_id == current_user.id
            and (status is None or task.status == status)
            and (agent_type is None or task.agent_type == agent_type)
        ]
        
        # Apply pagination
        return tasks[skip:skip + limit]
        
    except Exception as e:
        logger.error(f"Error listing agent tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list agent tasks"
        )

@router.get("/tasks/{task_id}", response_model=AgentTask)
async def get_agent_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get details of a specific agent task.
    """
    try:
        task = task_store.get(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
            
        # Check if the user has permission to access this task
        if task.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this task"
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

@router.put("/tasks/{task_id}", response_model=AgentTask)
async def update_agent_task(
    task_id: str,
    task_update: AgentTaskUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an existing agent task.
    
    Only certain fields can be updated after task creation.
    """
    try:
        task = task_store.get(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
            
        # Check if the user has permission to update this task
        if task.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this task"
            )
            
        # Only allow updating certain fields
        if task_update.title is not None:
            task.title = task_update.title
            
        if task_update.description is not None:
            task.description = task_update.description
            
        if task_update.status is not None:
            task.status = task_update.status
            
        task.updated_at = datetime.utcnow()
        
        # Update the task in the store
        task_store[task_id] = task
        
        logger.info(f"Updated agent task: {task_id}")
        return task
        
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
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an agent task.
    
    Only tasks that are not currently running can be deleted.
    """
    try:
        task = task_store.get(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
            
        # Check if the user has permission to delete this task
        if task.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this task"
            )
            
        # Don't allow deleting running tasks
        if task.status == AgentTaskStatus.RUNNING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete a running task"
            )
            
        # Remove the task from the store
        del task_store[task_id]
        
        logger.info(f"Deleted agent task: {task_id}")
        return JSONResponse(
            status_code=status.HTTP_204_NO_CONTENT,
            content=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting agent task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete agent task"
        )

@router.post("/tasks/{task_id}/cancel", response_model=AgentTask)
async def cancel_agent_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Cancel a running agent task.
    """
    try:
        task = task_store.get(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
            
        # Check if the user has permission to cancel this task
        if task.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this task"
            )
            
        # Only allow canceling running tasks
        if task.status != AgentTaskStatus.RUNNING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only running tasks can be canceled"
            )
            
        # Update the task status
        task.status = AgentTaskStatus.CANCELED
        task.updated_at = datetime.utcnow()
        
        # In a real implementation, we would also need to cancel any ongoing operations
        
        logger.info(f"Canceled agent task: {task_id}")
        return task
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling agent task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel agent task"
        )

async def process_agent_task(task_id: str, task_data: AgentTaskCreate):
    """
    Background task to process an agent task.
    
    This function runs in the background and updates the task status as it progresses.
    """
    try:
        # Get the task from the store
        task = task_store.get(task_id)
        if not task:
            logger.error(f"Task {task_id} not found in store")
            return
            
        # Update task status to running
        task.status = AgentTaskStatus.RUNNING
        task.updated_at = datetime.utcnow()
        
        # Process the task based on agent type
        try:
            if task.agent_type == AgentType.PLANNER:
                result = await agent_service.run_planner(task.input_data)
            elif task.agent_type == AgentType.RESEARCHER:
                result = await agent_service.run_researcher(task.input_data)
            elif task.agent_type == AgentType.DEVELOPER:
                result = await agent_service.run_developer(task.input_data)
            elif task.agent_type == AgentType.TESTER:
                result = await agent_service.run_tester(task.input_data)
            elif task.agent_type == AgentType.ORCHESTRATOR:
                result = await agent_service.run_orchestrator(task.input_data)
            else:
                raise ValueError(f"Unknown agent type: {task.agent_type}")
                
            # Update task with results
            task.result = result
            task.status = AgentTaskStatus.COMPLETED
            
        except Exception as e:
            # Handle errors during task processing
            logger.error(f"Error processing task {task_id}: {str(e)}")
            task.status = AgentTaskStatus.FAILED
            task.result = {
                "error": str(e),
                "error_type": type(e).__name__
            }
            
    except Exception as e:
        logger.error(f"Unexpected error in process_agent_task for task {task_id}: {str(e)}")
        
    finally:
        # Ensure task is updated in the store
        if task:
            task.updated_at = datetime.utcnow()
            task_store[task_id] = task
