import socketio
import logging

logger = logging.getLogger(__name__)

# Create an Async Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

async def join_task_room(sid, task_id):
    """Adds a socket session to a task-specific room."""
    await sio.enter_room(sid, f"task_{task_id}")
    logger.info(f"Session {sid} joined room task_{task_id}")

async def emit_progress(task_id, data):
    """Emits progress updates to all clients in a task-specific room."""
    await sio.emit("progress", data, room=f"task_{task_id}")
    logger.info(f"Emitted progress to task_{task_id}: {data.get('stage')}")

@sio.event
async def connect(sid, environ):
    logger.info(f"Socket connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Socket disconnected: {sid}")

@sio.event
async def join_task(sid, data):
    task_id = data.get("task_id")
    if task_id:
        await join_task_room(sid, task_id)
        await sio.emit("joined", {"task_id": task_id}, room=sid)
