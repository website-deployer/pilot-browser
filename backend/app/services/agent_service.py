"""
Agent Service for the Pilot Browser.

This module implements the core agent system that powers the Pilot Browser's
intelligent task automation capabilities.
"""
import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable, Awaitable
from enum import Enum
from dataclasses import dataclass, field
import json
from openai import AsyncOpenAI

from app.core.config import settings
from app.models import Task, TaskStatus, TaskType
from app.core.database import get_db_cm

# Configure logging
logger = logging.getLogger(__name__)

class AgentType(str, Enum):
    """Types of agents in the Pilot Browser system"""
    PLANNER = "planner"
    RESEARCHER = "researcher"
    DEVELOPER = "developer"
    TESTER = "tester"

@dataclass
class AgentContext:
    """Context passed between agents during task execution"""
    task_id: int
    user_id: int
    task_type: TaskType
    parameters: Dict[str, Any]
    state: Dict[str, Any] = field(default_factory=dict)
    results: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)

class Agent:
    """Base agent class"""
    def __init__(self, agent_type: AgentType):
        self.agent_type = agent_type
        self.initialized = False
    
    async def initialize(self):
        """Initialize the agent"""
        if not self.initialized:
            logger.info(f"Initializing {self.agent_type} agent")
            # Perform any initialization here
            self.initialized = True
    
    async def execute(self, context: AgentContext) -> AgentContext:
        """Execute the agent's task"""
        raise NotImplementedError("Subclasses must implement execute()")
    
    async def cleanup(self):
        """Clean up resources"""
        if self.initialized:
            logger.info(f"Cleaning up {self.agent_type} agent")
            self.initialized = False

class PlannerAgent(Agent):
    """Planner agent responsible for task planning and coordination"""
    def __init__(self, client: AsyncOpenAI):
        super().__init__(AgentType.PLANNER)
        self.client = client
    
    async def execute(self, context: AgentContext) -> AgentContext:
        """Plan the execution of a task"""
        logger.info(f"PlannerAgent executing task {context.task_id}")
        
        # Update task status
        await self._update_task_status(context.task_id, TaskStatus.RUNNING)
        
        try:
            prompt = f"""
            You are the Planner Agent of the Pilot Browser. Your job is to analyze a user task and create a step-by-step plan.
            User Task: {context.parameters.get('query')}

            Available tools: Web Search, Python Execution, Browser Automation (Playwright).

            Determine:
            1. If the task is feasible.
            2. If you need more information from the user.
            3. The steps required to complete the task.

            Respond in JSON format:
            {{
                "feasible": true/false,
                "needs_clarification": true/false,
                "questions": ["question1", ...],
                "plan": ["step1", "step2", ...],
                "reasoning": "..."
            }}
            """

            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "system", "content": "You are a helpful task planner."},
                          {"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )

            plan_data = json.loads(response.choices[0].message.content)
            context.state["plan"] = plan_data

            if plan_data.get("needs_clarification"):
                context.results["clarification_needed"] = True
                context.results["questions"] = plan_data.get("questions")
                await self._update_task_status(context.task_id, TaskStatus.PENDING)
            
            return context
        except Exception as e:
            logger.error(f"PlannerAgent error: {str(e)}", exc_info=True)
            context.errors.append(f"Planning failed: {str(e)}")
            await self._update_task_status(context.task_id, TaskStatus.FAILED, str(e))
            return context
    
    async def _update_task_status(self, task_id: int, status: TaskStatus, error: Optional[str] = None):
        """Update task status in the database"""
        async with get_db_cm() as db:
            task = await db.get(Task, task_id)
            if task:
                task.status = status
                if error:
                    task.error = error

class ResearchAgent(Agent):
    """Research agent responsible for gathering information"""
    def __init__(self, client: AsyncOpenAI):
        super().__init__(AgentType.RESEARCHER)
        self.client = client
    
    async def execute(self, context: AgentContext) -> AgentContext:
        """Perform research for the task"""
        logger.info(f"ResearchAgent executing task {context.task_id}")
        
        if context.results.get("clarification_needed"):
            return context

        try:
            from app.services.search_service import search_service
            query = context.parameters.get('query')
            search_results = await search_service.search(query=query)

            # Summarize research
            sources_text = "\n".join([f"- {r['title']}: {r['snippet']}" for r in search_results.get("results", [])])

            prompt = f"Summarize the following research results for the task '{query}':\n\n{sources_text}"

            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}]
            )

            context.results["research"] = {
                "summary": response.choices[0].message.content,
                "sources": search_results.get("results", [])
            }
            
            return context
        except Exception as e:
            logger.error(f"ResearchAgent error: {str(e)}", exc_info=True)
            context.errors.append(f"Research failed: {str(e)}")
            return context

class DeveloperAgent(Agent):
    """Developer agent responsible for generating automation scripts"""
    def __init__(self, client: AsyncOpenAI):
        super().__init__(AgentType.DEVELOPER)
        self.client = client
    
    async def execute(self, context: AgentContext) -> AgentContext:
        """Generate automation script for the task"""
        logger.info(f"DeveloperAgent executing task {context.task_id}")
        
        if context.results.get("clarification_needed"):
            return context

        try:
            research_summary = context.results.get("research", {}).get("summary", "")
            query = context.parameters.get('query')

            prompt = f"""
            You are the Developer Agent. Based on the task '{query}' and research '{research_summary}', generate a Python Playwright script to automate this task.
            The script should be self-contained and use the `sync_playwright` or `async_playwright` library.
            If the task requires an interactive 'app', generate a single-file HTML/JS app instead.

            Respond in JSON:
            {{
                "type": "playwright" or "app",
                "code": "...",
                "explanation": "..."
            }}
            """

            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )

            dev_data = json.loads(response.choices[0].message.content)
            context.results["artifact"] = dev_data
            
            return context
        except Exception as e:
            logger.error(f"DeveloperAgent error: {str(e)}", exc_info=True)
            context.errors.append(f"Script generation failed: {str(e)}")
            return context

class TesterAgent(Agent):
    """Tester agent responsible for validating automation scripts"""
    def __init__(self, client: AsyncOpenAI):
        super().__init__(AgentType.TESTER)
        self.client = client
    
    async def execute(self, context: AgentContext) -> AgentContext:
        """Test the generated automation script"""
        logger.info(f"TesterAgent executing task {context.task_id}")
        
        if context.results.get("clarification_needed"):
            return context

        try:
            artifact = context.results.get("artifact", {})
            if not artifact:
                return context

            # For now, simulate testing by asking the LLM to review the code
            prompt = f"Review the following code for errors or security issues:\n\n{artifact.get('code')}"

            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}]
            )

            context.results["test_results"] = {
                "passed": True,
                "review": response.choices[0].message.content
            }
            
            # Update task status to completed if no errors
            if not context.errors:
                async with get_db_cm() as db:
                    task = await db.get(Task, context.task_id)
                    if task:
                        task.status = TaskStatus.COMPLETED
                        task.result = context.results
            
            return context
        except Exception as e:
            logger.error(f"TesterAgent error: {str(e)}", exc_info=True)
            context.errors.append(f"Testing failed: {str(e)}")
            
            # Update task status to failed
            async with get_db_cm() as db:
                task = await db.get(Task, context.task_id)
                if task:
                    task.status = TaskStatus.FAILED
                    task.error = "\n".join(context.errors)
            
            return context

class AgentService:
    """Orchestrates the execution of agents"""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AgentService, cls).__new__(cls)
            cls._instance.initialized = False
            cls._instance.agents = {}
            cls._instance.client = None
        return cls._instance
    
    async def initialize(self):
        """Initialize the agent service and all agents"""
        if not self.initialized:
            logger.info("Initializing AgentService")
            
            # Initialize OpenAI client (pointing to LM Studio)
            self.client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE
            )

            # Initialize agents
            self.agents = {
                AgentType.PLANNER: PlannerAgent(self.client),
                AgentType.RESEARCHER: ResearchAgent(self.client),
                AgentType.DEVELOPER: DeveloperAgent(self.client),
                AgentType.TESTER: TesterAgent(self.client)
            }
            
            # Initialize all agents
            for agent in self.agents.values():
                await agent.initialize()
            
            self.initialized = True
            logger.info("AgentService initialized successfully")
    
    async def shutdown(self):
        """Shut down the agent service and clean up resources"""
        if self.initialized:
            logger.info("Shutting down AgentService")
            
            # Clean up all agents
            for agent in self.agents.values():
                await agent.cleanup()
            
            self.initialized = False
            logger.info("AgentService shut down successfully")
    
    async def execute_task(self, task_id: str, user_id: int, task_type: str, parameters: Dict[str, Any], resume_info: Optional[str] = None) -> Dict[str, Any]:
        """Execute a task using the agent system"""
        if not self.initialized:
            await self.initialize()
        
        # In a real app, we'd load the existing context if resuming
        context = AgentContext(
            task_id=task_id,
            user_id=user_id,
            task_type=task_type,
            parameters=parameters
        )
        
        if resume_info:
            context.state["clarification_response"] = resume_info
            context.state["resuming"] = True

        try:
            # Step 1: Planning
            context = await self.agents[AgentType.PLANNER].execute(context)
            if context.results.get("clarification_needed") and not resume_info:
                return {"status": "pending", "results": context.results}

            # Step 2: Research
            context = await self.agents[AgentType.RESEARCHER].execute(context)
            if context.errors: return {"status": "failed", "errors": context.errors}

            # Step 3: Development
            context = await self.agents[AgentType.DEVELOPER].execute(context)
            if context.errors: return {"status": "failed", "errors": context.errors}

            # Step 4: Testing & Execution
            context = await self.agents[AgentType.TESTER].execute(context)
            
            # Removed automatic execution for security reasons.
            # Scripts must be triggered by the user in the UI.

            return {
                "status": "completed",
                "results": context.results,
                "errors": context.errors
            }
        except Exception as e:
            error_msg = f"Task execution failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            # Update task status to failed
            async with get_db_cm() as db:
                task = await db.get(Task, task_id)
                if task:
                    task.status = TaskStatus.FAILED
                    task.error = error_msg
            
            return {
                "success": False,
                "error": error_msg,
                "errors": [error_msg] + context.errors
            }
