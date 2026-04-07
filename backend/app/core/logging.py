"""
Refined logging — Re-enabled access logs for visibility.
"""

import logging
import sys
from datetime import datetime, timezone

class ColorFormatter(logging.Formatter):
    """Clean, high-visibility developer format."""
    LEVEL_COLORS = {"INFO": "\033[32m", "WARNING": "\033[33m", "ERROR": "\033[31m", "DEBUG": "\033[36m"}
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.LEVEL_COLORS.get(record.levelname, "")
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
        return f"{ts} {color}[{record.levelname:<8}]{self.RESET} {record.name}: {record.getMessage()}"

def setup_logging(level: str = "INFO", json_logs: bool = False) -> None:
    """Configures root logger. Ensures uvicorn.access is visible."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColorFormatter())
    
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers.clear()
    root.addHandler(handler)

    # Re-enable access logs for visibility (VERY IMPORTANT for debugging)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
