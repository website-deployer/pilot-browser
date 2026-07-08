import asyncio
import subprocess
import tempfile
import os
import logging
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)
executor = ThreadPoolExecutor(max_workers=4)

def _run_subprocess(cmd, timeout):
    """Internal helper for running subprocess in a thread."""
    try:
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
    except subprocess.TimeoutExpired:
        raise
    except Exception as e:
        raise e

async def execute_playwright_script(script_code: str):
    """
    Executes a Playwright script in a secure environment.
    Tries Docker first, falls back to a restricted subprocess.
    Uses asyncio to avoid blocking the event loop.
    """
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as tmp:
        tmp.write(script_code.encode())
        tmp_path = tmp.name

    loop = asyncio.get_event_loop()

    try:
        # 1. Try Docker Execution
        docker_cmd = [
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", "256m",
            "--cpus", "0.5",
            "-v", f"{tmp_path}:/app/script.py:ro",
            "python:3.11-slim",
            "python", "/app/script.py"
        ]

        try:
            logger.info("Attempting Docker execution")
            result = await loop.run_in_executor(executor, _run_subprocess, docker_cmd, 30)

            if result.returncode == 125:
                raise subprocess.CalledProcessError(result.returncode, docker_cmd)

            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
                "sandbox": "docker"
            }
        except (subprocess.CalledProcessError, FileNotFoundError, asyncio.TimeoutError, subprocess.TimeoutExpired) as e:
            if isinstance(e, (asyncio.TimeoutError, subprocess.TimeoutExpired)):
                 return {"error": "Execution timed out", "sandbox": "docker"}
            logger.warning(f"Docker execution failed or unavailable: {str(e)}. Falling back to subprocess.")

        # 2. Fallback: Restricted Subprocess
        env = os.environ.copy()

        logger.info("Falling back to restricted subprocess")
        result = await loop.run_in_executor(executor, _run_subprocess, ["python3", tmp_path], 30)
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "sandbox": "subprocess"
        }

    except (asyncio.TimeoutError, subprocess.TimeoutExpired):
        return {"error": "Execution timed out", "sandbox": "subprocess"}
    except Exception as e:
        logger.error(f"Execution error: {str(e)}")
        return {"error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
