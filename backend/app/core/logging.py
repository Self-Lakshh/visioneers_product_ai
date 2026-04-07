"""
Structured logging setup for Visioneers Product AI backend.

Uses Python's standard `logging` module configured with JSON-like structured
output in development and production. No third-party log libraries required.
"""

import logging
import json
import sys
import traceback
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    """
    Emits log records as single-line JSON objects for easy ingestion
    by log aggregators (Datadog, CloudWatch, Loki, etc.).
    """

    def format(self, record: logging.LogRecord) -> str:
        log_obj: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Attach extra fields (e.g. request_id, user_id) passed via `extra=`
        for key, value in record.__dict__.items():
            if key not in {
                "name", "msg", "args", "levelname", "levelno", "pathname",
                "filename", "module", "exc_info", "exc_text", "stack_info",
                "lineno", "funcName", "created", "msecs", "relativeCreated",
                "thread", "threadName", "processName", "process", "message",
                "taskName",
            }:
                log_obj[key] = value

        if record.exc_info:
            log_obj["exception"] = traceback.format_exception(*record.exc_info)

        return json.dumps(log_obj, default=str)


class PrettyFormatter(logging.Formatter):
    """Human-readable formatter for local development."""

    LEVEL_COLORS = {
        "DEBUG":    "\033[36m",   # cyan
        "INFO":     "\033[32m",   # green
        "WARNING":  "\033[33m",   # yellow
        "ERROR":    "\033[31m",   # red
        "CRITICAL": "\033[35m",   # magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.LEVEL_COLORS.get(record.levelname, "")
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
        prefix = f"{color}[{record.levelname:<8}]{self.RESET}"
        return f"{ts} {prefix} {record.name}: {record.getMessage()}"


def setup_logging(level: str = "INFO", json_logs: bool = False) -> None:
    """
    Configure root logger and suppress noisy third-party loggers.

    Args:
        level:     Log level string (DEBUG / INFO / WARNING / ERROR).
        json_logs: If True, emit JSON. If False, use pretty dev format.
    """
    formatter: logging.Formatter = (
        JSONFormatter() if json_logs else PrettyFormatter()
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.handlers.clear()
    root.addHandler(handler)

    # Silence noisy libraries
    for noisy in ("uvicorn.access", "httpx", "httpcore"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Convenience factory — mirrors `logging.getLogger` with a clear name."""
    return logging.getLogger(name)
