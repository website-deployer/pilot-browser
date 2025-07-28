"""
Data models for the Agent Mode functionality.

This module defines the Pydantic models used for request/response validation
and data transfer in the Agent Mode API.
"""
from enum import Enum
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, validator
from uuid import UUID, uuid4

class AgentType(str, Enum):
    """Types of agents in the system."""
    PLANNER = "planner"
    RESEARCHER = "researcher"
    DEVELOPER = "developer"
    TESTER = "tester"
    ORCHESTRATOR = "orchestrator"

class AgentTaskStatus(str, Enum):
    """Possible statuses for an agent task."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"
    PAUSED = "paused"

class AgentTaskStep(BaseModel):
    """A single step in an agent task's execution."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    status: AgentTaskStatus = AgentTaskStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class AgentTaskResult(BaseModel):
    """The result of an agent task."""
    success: bool
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    artifacts: Optional[List[Dict[str, str]]] = None

class AgentTaskBase(BaseModel):
    """Base model for agent tasks."""
    title: str = Field(..., min_length=1, max_length=200, description="A short title for the task")
    description: Optional[str] = Field(None, max_length=1000, description="A detailed description of the task")
    agent_type: AgentType = Field(..., description="The type of agent to use for this task")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Input data for the task")

class AgentTaskCreate(AgentTaskBase):
    """Model for creating a new agent task."""
    pass

class AgentTaskUpdate(BaseModel):
    """Model for updating an existing agent task."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="A short title for the task")
    description: Optional[str] = Field(None, max_length=1000, description="A detailed description of the task")
    status: Optional[AgentTaskStatus] = Field(None, description="The new status of the task")
    
    class Config:
        extra = "forbid"  # Don't allow extra fields in updates

class AgentTask(AgentTaskBase):
    """Full agent task model with all fields."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str = Field(..., description="ID of the user who created the task")
    status: AgentTaskStatus = Field(default=AgentTaskStatus.PENDING, description="Current status of the task")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When the task was created")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="When the task was last updated")
    started_at: Optional[datetime] = Field(None, description="When the task started running")
    completed_at: Optional[datetime] = Field(None, description="When the task was completed")
    steps: List[AgentTaskStep] = Field(default_factory=list, description="List of steps in the task's execution")
    result: Optional[AgentTaskResult] = Field(None, description="The result of the task")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata about the task")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "user123",
                "title": "Research AI in healthcare",
                "description": "Find recent developments in AI applications for healthcare",
                "agent_type": "researcher",
                "status": "completed",
                "created_at": "2023-01-01T12:00:00Z",
                "updated_at": "2023-01-01T12:30:00Z",
                "started_at": "2023-01-01T12:00:30Z",
                "completed_at": "2023-01-01T12:29:45Z",
                "input_data": {
                    "topic": "AI in healthcare",
                    "sources": ["academic_papers", "news_articles", "industry_reports"],
                    "timeframe": "last_6_months"
                },
                "steps": [
                    {
                        "id": "step1",
                        "name": "gather_sources",
                        "status": "completed",
                        "started_at": "2023-01-01T12:00:30Z",
                        "completed_at": "2023-01-01T12:10:15Z"
                    },
                    {
                        "id": "step2",
                        "name": "analyze_content",
                        "status": "completed",
                        "started_at": "2023-01-01T12:10:16Z",
                        "completed_at": "2023-01-01T12:25:30Z"
                    },
                    {
                        "id": "step3",
                        "name": "generate_report",
                        "status": "completed",
                        "started_at": "2023-01-01T12:25:31Z",
                        "completed_at": "2023-01-01T12:29:45Z"
                    }
                ],
                "result": {
                    "success": true,
                    "output": {
                        "report": "Recent developments in AI for healthcare show significant advancements...",
                        "key_findings": [
                            "AI is being used for early disease detection",
                            "Natural language processing is improving patient record analysis",
                            "Computer vision is enhancing medical imaging diagnosis"
                        ],
                        "sources": [
                            {"title": "AI in Healthcare 2023", "url": "https://example.com/ai-healthcare-2023"},
                            {"title": "ML for Medical Imaging", "url": "https://example.com/ml-medical-imaging"}
                        ]
                    },
                    "metrics": {
                        "sources_analyzed": 42,
                        "processing_time_seconds": 1125,
                        "report_length_chars": 2456
                    },
                    "artifacts": [
                        {"type": "report", "format": "pdf", "url": "/downloads/report-123.pdf"},
                        {"type": "data", "format": "json", "url": "/downloads/data-123.json"}
                    ]
                },
                "metadata": {
                    "priority": "high",
                    "tags": ["ai", "healthcare", "research"]
                }
            }
        }

class AgentTaskList(BaseModel):
    """Model for a paginated list of agent tasks."""
    items: List[AgentTask] = Field(..., description="List of agent tasks")
    total: int = Field(..., description="Total number of tasks matching the query")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    has_more: bool = Field(..., description="Whether there are more items available")

class AgentCapabilities(BaseModel):
    """Model describing the capabilities of an agent type."""
    agent_type: AgentType
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    parameters: Dict[str, Any] = {}
    
    class Config:
        schema_extra = {
            "example": {
                "agent_type": "researcher",
                "name": "Research Agent",
                "description": "Conducts research on a given topic and returns a comprehensive report.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "topic": {"type": "string", "description": "The topic to research"},
                        "sources": {"type": "array", "items": {"type": "string"}, "description": "Sources to include"},
                        "timeframe": {"type": "string", "description": "Timeframe for the research"}
                    },
                    "required": ["topic"]
                },
                "output_schema": {
                    "type": "object",
                    "properties": {
                        "report": {"type": "string"},
                        "key_findings": {"type": "array", "items": {"type": "string"}},
                        "sources": {"type": "array", "items": {"type": "object"}}
                    }
                },
                "parameters": {
                    "max_sources": 10,
                    "supports_web_search": True,
                    "supports_file_uploads": True
                }
            }
        }
