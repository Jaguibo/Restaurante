import logging
from functools import wraps
from flask import jsonify

logger = logging.getLogger()  # root logger, respeta configuración global

def log_exceptions(endpoint_name):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.error(f"[{endpoint_name}] ❌ Excepción: {e}", exc_info=True)
                return jsonify({"error": "Error interno"}), 500
        return wrapper
    return decorator