from flask import Blueprint, request, session, jsonify
from backend.db import get_db_connection
import logging
import bcrypt

auth = Blueprint("auth", __name__, url_prefix="/api")
logger = logging.getLogger(__name__)

# 🔐 Login de usuario
@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    client_ip = request.remote_addr

    if not username or not password:
        logger.warning(f"[LOGIN] ❌ Campos vacíos | IP: {client_ip}")
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT usuario, password, rol FROM usuarios WHERE usuario = ?
            """, (username,))
            usuario = cursor.fetchone()

            if not usuario:
                logger.warning(f"[LOGIN] ❌ Usuario no encontrado: {username} | IP: {client_ip}")
                return jsonify({"error": "Credenciales inválidas"}), 401

            password_hash = usuario["password"]

            # ⚠️ Validación HASH con bcrypt
            if not bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8")):
                logger.warning(f"[LOGIN] ❌ Contraseña incorrecta para {username} | IP: {client_ip}")
                return jsonify({"error": "Credenciales inválidas"}), 401

            # ✅ Autenticado correctamente
            session["usuario"] = usuario["usuario"]
            session["rol"] = usuario["rol"]

            logger.info(f"[LOGIN] ✅ Usuario autenticado: {username} | Rol: {usuario['rol']} | IP: {client_ip}")
            return jsonify({"ok": True, "rol": usuario["rol"]}), 200

    except Exception as e:
        logger.exception(f"[LOGIN] ❌ Error al autenticar usuario: {e}")
        return jsonify({"error": "Error interno"}), 500

# 🔍 Verificación de sesión activa
@auth.route("/verificar", methods=["GET"])
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
def logout():
    usuario = session.get("usuario", "desconocido")
    session.clear()
    logger.info(f"[LOGOUT] 🔒 Sesión cerrada por: {usuario}")
    return jsonify({"ok": True, "mensaje": "Sesión cerrada"}), 200
