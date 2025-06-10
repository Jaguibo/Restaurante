from flask import Blueprint, request, jsonify, session
from backend.db import get_db_connection
import logging
import traceback
import bcrypt

admin = Blueprint("admin", __name__, url_prefix="/api")

logger = logging.getLogger(__name__)

# 🔒 Middleware: Solo admins
def es_admin():
    return session.get("rol") == "admin"

# ================================
# 🥘 GESTIÓN DE PRODUCTOS
# ================================

@admin.route("/productos", methods=["GET"])
def listar_productos():
    if not es_admin():
        return jsonify({"error": "No autorizado"}), 403
    with get_db_connection() as conn:
        productos = conn.execute("SELECT * FROM productos").fetchall()
        return jsonify([dict(p) for p in productos])

@admin.route("/productos", methods=["POST"])
def agregar_producto():
    if not es_admin():
        return jsonify({"error": "No autorizado"}), 403
    data = request.get_json()
    nombre = data.get("nombre")
    precio = data.get("precio")
    categoria = data.get("categoria", "otros")
    if not nombre or precio is None:
        return jsonify({"ok": False, "error": "Faltan datos"}), 400
    try:
        with get_db_connection() as conn:
            conn.execute(
                "INSERT INTO productos (nombre, precio, categoria) VALUES (?, ?, ?)",
                (nombre, precio, categoria)
            )
            conn.commit()
        return jsonify({"ok": True, "mensaje": "Producto agregado"})
    except Exception as e:
        logger.exception(f"[ADMIN] ❌ Error al agregar producto: {e}")
        return jsonify({"ok": False, "error": "Error al agregar producto"}), 500

@admin.route("/productos/<int:id>", methods=["PUT"])
def editar_producto(id):
    if not es_admin():
        return jsonify({"error": "No autorizado"}), 403
    data = request.get_json()
    nombre = data.get("nombre")
    precio = data.get("precio")
    categoria = data.get("categoria", "otros")
    try:
        with get_db_connection() as conn:
            conn.execute(
                "UPDATE productos SET nombre = ?, precio = ?, categoria = ? WHERE id = ?",
                (nombre, precio, categoria, id)
            )
            conn.commit()
        return jsonify({"ok": True, "mensaje": "Producto actualizado"})
    except Exception as e:
        logger.exception(f"[ADMIN] ❌ Error al editar producto: {e}")
        return jsonify({"ok": False, "error": "Error al editar producto"}), 500

@admin.route("/productos/<int:id>", methods=["DELETE"])
def eliminar_producto(id):
    if not es_admin():
        return jsonify({"error": "No autorizado"}), 403
    try:
        with get_db_connection() as conn:
            conn.execute("DELETE FROM productos WHERE id = ?", (id,))
            conn.commit()
        return jsonify({"ok": True, "mensaje": "Producto eliminado"})
    except Exception as e:
        logger.exception(f"[ADMIN] ❌ Error al eliminar producto: {e}")
        return jsonify({"ok": False, "error": "Error al eliminar producto"}), 500

# ================================
# 👤 GESTIÓN DE USUARIOS
# ================================

@admin.route("/usuarios", methods=["GET"])
def listar_usuarios():
    if not es_admin():
        return jsonify({"error": "No autorizado"}), 403
    with get_db_connection() as conn:
        usuarios = conn.execute("SELECT usuario, rol FROM usuarios").fetchall()
        return jsonify([dict(u) for u in usuarios])

@admin.route("/usuarios", methods=["POST"])
def agregar_usuario():
    if not es_admin():
        return jsonify({"error": "No autorizado"}), 403
    data = request.get_json()
    usuario = data.get("usuario")
    password = data.get("password")
    rol = data.get("rol")
    if not all([usuario, password, rol]):
        return jsonify({"ok": False, "error": "Faltan datos"}), 400
    try:
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        with get_db_connection() as conn:
            conn.execute(
                "INSERT INTO usuarios (usuario, password, rol) VALUES (?, ?, ?)",
                (usuario, password_hash, rol)
            )
            conn.commit()
        return jsonify({"ok": True, "mensaje": "Usuario creado"})
    except Exception as e:
        logger.exception(f"[ADMIN] ❌ Error al crear usuario: {e}")
        return jsonify({"ok": False, "error": "Error al crear usuario"}), 500

@admin.route("/usuarios/<usuario>", methods=["DELETE"])
def eliminar_usuario(usuario):
    if not es_admin():
        return jsonify({"error": "No autorizado"}), 403
    try:
        with get_db_connection() as conn:
            conn.execute("DELETE FROM usuarios WHERE usuario = ?", (usuario,))
            conn.commit()
        return jsonify({"ok": True, "mensaje": "Usuario eliminado"})
    except Exception as e:
        logger.exception(f"[ADMIN] ❌ Error al eliminar usuario: {e}")
        return jsonify({"ok": False, "error": "Error al eliminar usuario"}), 500

# ================================
# 📈 MÉTRICAS DE TIEMPOS DE PEDIDOS
# ================================

@admin.route("/metricas", methods=["GET"])
def ver_metricas():
    if not es_admin():
        return jsonify({"error": "No autorizado"}), 403
    try:
        with get_db_connection() as conn:
            metricas = conn.execute("""
                SELECT m.pedido_id, m.tiempo_preparacion, m.tiempo_entrega,
                       p.mesa, p.mesero, p.fecha
                FROM pedido_metricas m
                JOIN pedidos p ON p.id = m.pedido_id
                ORDER BY p.fecha DESC
            """).fetchall()
            return jsonify([dict(m) for m in metricas])
    except Exception as e:
        logger.exception(f"[ADMIN] ❌ Error al obtener métricas: {e}")
        return jsonify({"error": "Error interno"}), 500

# ================================
# 🔔 NOTIFICACIONES DEL SISTEMA
# ================================

@admin.route("/notificaciones", methods=["GET"])
def ver_notificaciones():
    if not es_admin():
        return jsonify({"error": "No autorizado"}), 403
    try:
        with get_db_connection() as conn:
            notificaciones = conn.execute("""
                SELECT id, tipo, mensaje, fecha_hora
                FROM notificaciones
                ORDER BY fecha_hora DESC
                LIMIT 50
            """).fetchall()
            return jsonify([dict(n) for n in notificaciones])
    except Exception as e:
        logger.exception(f"[ADMIN] ❌ Error al obtener notificaciones: {e}")
        return jsonify({"error": "Error interno"}), 500
