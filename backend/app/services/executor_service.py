import subprocess
import tempfile
import os

def execute_playwright_script(script_code: str):
    """Executes a Playwright script in a secure temporary file."""
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as tmp:
        tmp.write(script_code.encode())
        tmp_path = tmp.name

    try:
        # Run the script using the current python interpreter
        result = subprocess.run(
            ["python", tmp_path],
            capture_output=True,
            text=True,
            timeout=60
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"error": "Execution timed out"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
