"""
Background task manager for handling async operations
"""
import asyncio
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class BackgroundTaskManager:
    """Manages background tasks and their status"""
    
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.running_tasks: Dict[str, asyncio.Task] = {}
    
    async def create_task(self, 
                         task_func: Callable, 
                         task_name: str, 
                         task_args: tuple = (), 
                         task_kwargs: dict = None) -> str:
        """Create and start a new background task"""
        if task_kwargs is None:
            task_kwargs = {}
            
        task_id = str(uuid.uuid4())
        
        # Create task info
        task_info = {
            'id': task_id,
            'name': task_name,
            'status': 'running',
            'created_at': datetime.utcnow(),
            'progress': 0,
            'result': None,
            'error': None
        }
        
        self.tasks[task_id] = task_info
        
        # Create and start the actual asyncio task
        async def wrapped_task():
            try:
                logger.info(f"Starting background task: {task_name} ({task_id})")
                result = await task_func(*task_args, **task_kwargs)
                self.tasks[task_id]['status'] = 'completed'
                self.tasks[task_id]['result'] = result
                self.tasks[task_id]['progress'] = 100
                logger.info(f"Background task completed: {task_name} ({task_id})")
            except Exception as e:
                logger.error(f"Background task failed: {task_name} ({task_id}): {e}")
                self.tasks[task_id]['status'] = 'failed'
                self.tasks[task_id]['error'] = str(e)
            finally:
                # Clean up the running task reference
                if task_id in self.running_tasks:
                    del self.running_tasks[task_id]
        
        # Start the task
        task = asyncio.create_task(wrapped_task())
        self.running_tasks[task_id] = task
        
        return task_id
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a task"""
        return self.tasks.get(task_id)
    
    def get_all_tasks(self) -> Dict[str, Dict[str, Any]]:
        """Get all tasks"""
        return self.tasks.copy()
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a running task"""
        if task_id in self.running_tasks:
            task = self.running_tasks[task_id]
            if not task.done():
                task.cancel()
                self.tasks[task_id]['status'] = 'cancelled'
                return True
        return False
    
    def update_task_progress(self, task_id: str, progress: int, message: str = None):
        """Update task progress"""
        if task_id in self.tasks:
            self.tasks[task_id]['progress'] = progress
            if message:
                self.tasks[task_id]['message'] = message

# Global task manager instance
task_manager = BackgroundTaskManager()
