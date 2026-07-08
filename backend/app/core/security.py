import base64
import json
from typing import Any, Dict, Optional
from cryptography.fernet import Fernet
from app.core.config import settings


def encrypt_credentials(data: Dict[str, Any], user_id: int) -> str:
    key = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].ljust(32).encode())
    f = Fernet(key)
    return f.encrypt(json.dumps(data).encode()).decode()


def decrypt_credentials(encrypted_data: str, user_id: int) -> Dict[str, Any]:
    key = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].ljust(32).encode())
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_data.encode()).decode()
    return json.loads(decrypted)
