from flask import Blueprint, request, session, jsonify
from backend.db import get_db_connection
import logging
import bcrypt  # 👈 Se usa bcrypt, no hashlib
from backend.utils.error_logging import log_exceptions

auth = Blueprint("auth", __name__, url_prefix="/api")
logger = logging.getLogger(__name__)

# 🔐 Login de usuario
@auth.route("/login", methods=["POST"])
@log_exceptions("login")
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    client_ip = request.remote_addr

    if not username or not password:
        logger.warning(f"[LOGIN] ❌ Campos vacíos | IP: {client_ip}")
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT usuario, password, rol FROM usuarios WHERE usuario = ?
        """, (username,))
        usuario = cursor.fetchone()

        if not usuario:
            logger.warning(f"[LOGIN] ❌ Usuario no encontrado: {username} | IP: {client_ip}")
            return jsonify({"error": "Usuario no encontrado"}), 401

        password_hash_db = usuario["password"].strip()

        # ✅ Verificar con bcrypt
        if not bcrypt.checkpw(password.encode("utf-8"), password_hash_db.encode("utf-8")):
            logger.warning(f"[LOGIN] ❌ Contraseña incorrecta para {username} | IP: {client_ip}")
            return jsonify({"error": "Contraseña incorrecta"}), 401

        # ✅ Autenticado correctamente
        session["usuario"] = usuario["usuario"]
        session["rol"] = usuario["rol"]

        logger.info(f"[LOGIN] ✅ Usuario autenticado: {username} | Rol: {usuario['rol']} | IP: {client_ip}")
        return jsonify({"ok": True, "rol": usuario["rol"]}), 200

# 🔍 Verificación de sesión activa
@auth.route("/verificar", methods=["GET"])
@log_exceptions("verificar_sesion")
def verificar_sesion():
    if "usuario" in session and "rol" in session:
        return jsonify({
            "ok": True,
            "usuario": session["usuario"],
            "rol": session["rol"]
        }), 200
    return jsonify({"ok": False}), 403

# 🚪 Cierre de sesión
@auth.route("/logout", methods=["POST"])
@log_exceptions("logout")
def logout():
    usuario = session.get("usuario", "desconocido")
    session.clear()
    logger.info(f"[LOGOUT] 🔒 Sesión cerrada por: {usuario}")
    return jsonify({"ok": True, "mensaje": "Sesión cerrada"}), 200

# 🛠️ Ruta de depuración de sesión (temporal)
@auth.route("/debug-session", methods=["GET"])
def debug_session():
    return jsonify({
        "usuario": session.get("usuario"),
        "rol": session.get("rol"),
        "session_data": dict(session)
    })

# ✅ NUEVO: Ruta para obtener usuario autenticado (para el frontend)
@auth.route("/usuario", methods=["GET"])
def obtener_usuario():
    nombre = session.get("usuario")
    rol = session.get("rol")
    
    if not nombre:
        return jsonify({"error": "No autenticado"}), 401

    return jsonify({"nombre": nombre, "rol": rol}), 200