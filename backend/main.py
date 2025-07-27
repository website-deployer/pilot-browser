"""
Pilot Browser Backend

This is the main entry point for the Pilot Browser backend API.
It initializes the FastAPI application and sets up all the necessary routes and middleware.
"""
import os
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('pilot_backend.log')
    ]
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Pilot Browser Backend",
    description="Backend API for the Pilot Browser application",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (for serving the frontend in production)
static_dir = Path(__file__).parent.parent / "src" / "renderer"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Import and include routers
from app.api import router as api_router
app.include_router(api_router, prefix="/api/v1")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "version": "0.1.0"}

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return {"detail": "An unexpected error occurred"}, 500

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Pilot Browser Backend...")
    # Initialize services, load models, etc.
    try:
        # Initialize database connection
        from app.core.database import init_db
        await init_db()
        
        # Initialize AI services
        from app.services.agent_service import AgentService
        await AgentService.initialize()
        
        logger.info("Pilot Browser Backend started successfully")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}", exc_info=True)
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    logger.info("Shutting down Pilot Browser Backend...")
    # Clean up resources, close connections, etc.
    try:
        from app.services.agent_service import AgentService
        await AgentService.shutdown()
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}", exc_info=True)

# For development with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
