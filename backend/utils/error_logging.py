import logging
from functools import wraps
from flask import jsonify, request

def log_exceptions(endpoint_name=None):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            try:
                return f(*args, **kwargs)
            except Exception as e:
                ruta = endpoint_name or request.path
                logging.exception(f"Error en endpoint {ruta}")
                return jsonify({"error": "Error interno"}), 500
        return wrapped
    return decorator