from flask import Blueprint, request, session, jsonify
from backend.db import get_db_connection
import logging

auth = Blueprint("auth", __name__, url_prefix="/api")

# 📝 Logging
logging.basicConfig(filename='logs/app.log', level=logging.INFO)

# 🔐 Login con base de datos
@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    client_ip = request.remote_addr

    if not username or not password:
        logging.warning(f"[LOGIN] ❌ Campos vacíos | IP: {client_ip}")
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT usuario, password, rol FROM usuarios WHERE usuario = ?
            """, (username,))
            usuario = cursor.fetchone()

            if not usuario:
                logging.warning(f"[LOGIN] ❌ Usuario no encontrado: {username} | IP: {client_ip}")
                return jsonify({"error": "Credenciales inválidas"}), 401

            if usuario["password"] != password:
                logging.warning(f"[LOGIN] ❌ Contraseña incorrecta para {username} | IP: {client_ip}")
                return jsonify({"error": "Credenciales inválidas"}), 401

            # ✅ Autenticado
            session["usuario"] = usuario["usuario"]
            session["rol"] = usuario["rol"]

            logging.info(f"[LOGIN] ✅ Usuario autenticado: {username} | Rol: {usuario['rol']} | IP: {client_ip}")
            return jsonify({"ok": True, "rol": usuario["rol"]}), 200

    except Exception as e:
        logging.exception(f"[LOGIN] ❌ Error al autenticar usuario: {e}")
        return jsonify({"error": "Error interno"}), 500

# 🔍 Verificar sesión
@auth.route("/verificar", methods=["GET"])
def verificar_sesion():
    if "usuario" in session and "rol" in session:
        return jsonify({
            "ok": True,
            "usuario": session["usuario"],
            "rol": session["rol"]
        }), 200
    return jsonify({"ok": False}), 403

# 🚪 Logout
@auth.route("/logout", methods=["POST"])
def logout():
    usuario = session.get("usuario", "desconocido")
    session.clear()
    logging.info(f"[LOGOUT] 🔒 Sesión cerrada por: {usuario}")
    return jsonify({"ok": True, "mensaje": "Sesión cerrada"}), 200
