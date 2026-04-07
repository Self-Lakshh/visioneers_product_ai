"""
Utility helpers — small, pure, dependency-free functions.
"""

import uuid
import time
import hashlib
from typing import Any


def generate_request_id() -> str:
    """Generate a URL-safe unique request ID."""
    return str(uuid.uuid4())


def hash_url(url: str) -> str:
    """
    Deterministic SHA-256 hash of a URL string.
    Used as a cache key so the same URL always maps to the same key.
    """
    return hashlib.sha256(url.encode()).hexdigest()


def current_unix_ms() -> int:
    """Return current UTC time as Unix milliseconds."""
    return int(time.time() * 1000)


def sanitize_dict(data: dict[str, Any], redact_keys: set[str] | None = None) -> dict[str, Any]:
    """
    Return a copy of `data` with sensitive keys replaced by '***'.
    Useful for safe logging of request payloads.

    Args:
        data:        Dictionary to sanitize.
        redact_keys: Keys to redact. Defaults to common secret field names.
    """
    if redact_keys is None:
        redact_keys = {"password", "secret", "token", "api_key", "authorization"}

    return {
        k: "***" if k.lower() in redact_keys else v
        for k, v in data.items()
    }
