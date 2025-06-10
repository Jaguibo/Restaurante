from flask import Blueprint, request, jsonify, session
from backend.db import get_db_connection
import logging
import datetime
import os

# 📂 Logging (solo una vez y al inicio)
os.makedirs("logs", exist_ok=True)
logging.basicConfig(filename="logs/app.log", level=logging.INFO)

pedidos = Blueprint('pedidos', __name__, url_prefix="/api")

# 🚀 Registrar nuevo pedido
@pedidos.route("/pedidos", methods=["POST"])
def registrar_pedido():
    if session.get("rol") != "mesero":
        return jsonify({"ok": False, "error": "No autorizado"}), 403

    data = request.get_json()
    mesa = data.get("mesa")
    cuenta = data.get("cuenta")
    items = data.get("items")
    mesero = data.get("mesero")
    fecha = data.get("fecha")

    if not isinstance(items, list) or not all([mesa, cuenta, items, mesero, fecha]):
        logging.warning(f"[PEDIDO] ❌ Datos incompletos: {data}")
        return jsonify({"ok": False, "error": "Faltan datos"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO pedidos (mesa, cuenta, mesero, fecha, estado) VALUES (?, ?, ?, ?, 'pendiente')",
                (mesa, cuenta, mesero, fecha)
            )
            pedido_id = cursor.lastrowid

            for item in items:
                nombre = item.get("nombre")
                producto = item.get("producto")
                cantidad = item.get("cantidad")
                if not producto or not isinstance(cantidad, int):
                    continue

                precio = cursor.execute(
                    "SELECT precio FROM productos WHERE nombre = ?",
                    (producto,)
                ).fetchone()
                precio_valor = precio["precio"] if precio else 0

                cursor.execute(
                    "INSERT INTO items (pedido_id, nombre, producto, cantidad, precio) VALUES (?, ?, ?, ?, ?)",
                    (pedido_id, nombre, producto, cantidad, precio_valor)
                )

            cursor.execute("INSERT INTO pedidos_listos (pedido_id, hora_listo) VALUES (?, NULL)", (pedido_id,))
            conn.commit()

            logging.info(f"[PEDIDO] ✅ Pedido #{pedido_id} registrado")
            return jsonify({"ok": True, "id_pedido": pedido_id})

    except Exception as e:
        logging.exception(f"[PEDIDO] ❌ Error al registrar: {e}")
        return jsonify({"ok": False, "error": "Error interno"}), 500

# 📋 Pedido por mesa
@pedidos.route("/pedido/<mesa>", methods=["GET"])
def obtener_pedido_por_mesa(mesa):
    if session.get("rol") != "mesero":
        return jsonify({"ok": False, "error": "No autorizado"}), 403

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            pedido = cursor.execute("""
                SELECT id, cuenta FROM pedidos
                WHERE mesa = ? AND estado = 'pendiente'
                ORDER BY fecha DESC LIMIT 1
            """, (mesa,)).fetchone()

            if not pedido:
                return jsonify({"ok": False, "error": "No hay pedido activo"}), 404

            items = cursor.execute("""
                SELECT nombre, producto, cantidad, precio
                FROM items WHERE pedido_id = ?
            """, (pedido["id"],)).fetchall()

            return jsonify({
                "id": pedido["id"],
                "mesa": mesa,
                "cuenta": pedido["cuenta"],
                "items": [dict(row) for row in items]
            })

    except Exception as e:
        logging.exception(f"[CUENTA] ❌ Error obteniendo pedido mesa {mesa}: {e}")
        return jsonify({"ok": False, "error": "Error interno"}), 500

# ✅ Cerrar cuenta
@pedidos.route("/cerrar-cuenta", methods=["POST"])
def cerrar_cuenta():
    if session.get("rol") != "mesero":
        return jsonify({"ok": False, "error": "No autorizado"}), 403

    data = request.get_json()
    pedido_id = data.get("pedido_id")
    mesa = data.get("mesa")
    mesero = data.get("mesero")
    total = data.get("total")
    detalle = data.get("detalle")

    if not all([pedido_id, mesa, mesero, isinstance(detalle, list)]) or total is None:
        logging.warning(f"[CUENTA] ⚠️ Datos incompletos: {data}")
        return jsonify({"ok": False, "error": "Faltan datos"}), 400

    try:
        fecha_hora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with get_db_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("UPDATE pedidos SET estado = 'cerrado' WHERE id = ?", (pedido_id,))
            cursor.execute("""
                INSERT INTO cierre_cuentas (pedido_id, mesa, mesero, total, fecha_hora)
                VALUES (?, ?, ?, ?, ?)
            """, (pedido_id, mesa, mesero, total, fecha_hora))

            for d in detalle:
                cliente = d.get("cliente", "General")[:50]
                subtotal = float(d.get("subtotal") or 0)
                propina = float(d.get("propina") or 0)

                cursor.execute("""
                    INSERT INTO detalle_cierre (pedido_id, cliente, subtotal, propina)
                    VALUES (?, ?, ?, ?)
                """, (pedido_id, cliente, subtotal, propina))

            conn.commit()
            logging.info(f"[CIERRE] ✅ Cuenta cerrada - Mesa: {mesa} | Pedido: {pedido_id}")
            return jsonify({"ok": True})

    except Exception as e:
        logging.exception(f"[CIERRE] ❌ Error al cerrar cuenta mesa {mesa}: {e}")
        return jsonify({"ok": False, "error": "Error interno"}), 500

# 📦 Listos
@pedidos.route("/pedidos-listos", methods=["GET"])
def obtener_pedidos_listos():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.id, p.mesa, p.cuenta, i.nombre, i.producto, i.cantidad, i.precio
                FROM pedidos p
                JOIN items i ON p.id = i.pedido_id
                JOIN pedidos_listos pl ON p.id = pl.pedido_id
                WHERE p.estado = 'pendiente' AND pl.hora_listo IS NOT NULL
                AND p.id NOT IN (SELECT pedido_id FROM pedidos_recibidos)
                ORDER BY p.id
            """)
            rows = cursor.fetchall()
            pedidos_dict = {}
            for row in rows:
                pid = row["id"]
                if pid not in pedidos_dict:
                    pedidos_dict[pid] = {
                        "id": pid, "mesa": row["mesa"], "cuenta": row["cuenta"], "items": []
                    }
                pedidos_dict[pid]["items"].append({
                    "nombre": row["nombre"], "producto": row["producto"],
                    "cantidad": row["cantidad"], "precio": row["precio"]
                })
            return jsonify(list(pedidos_dict.values()))

    except Exception as e:
        logging.exception("[PEDIDO] ❌ Error al cargar listos: %s", e)
        return jsonify({"ok": False, "error": "Error al cargar pedidos listos"}), 500

# 🍳 Cocina - pendientes
@pedidos.route("/pedidos-pendientes", methods=["GET"])
def obtener_pedidos_pendientes():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.id, p.mesa, p.fecha, i.nombre, i.producto, i.cantidad, i.precio
                FROM pedidos p
                JOIN items i ON p.id = i.pedido_id
                JOIN pedidos_listos pl ON p.id = pl.pedido_id
                WHERE p.estado = 'pendiente' AND pl.hora_listo IS NULL
                ORDER BY p.fecha ASC, p.id ASC
            """)
            rows = cursor.fetchall()
            pedidos_dict = {}
            for row in rows:
                pid = row["id"]
                if pid not in pedidos_dict:
                    pedidos_dict[pid] = {"id": pid, "mesa": row["mesa"], "fecha_hora": row["fecha"], "items": []}
                pedidos_dict[pid]["items"].append({
                    "nombre": row["nombre"], "producto": row["producto"],
                    "cantidad": row["cantidad"], "precio": row["precio"]
                })
            return jsonify(list(pedidos_dict.values()))

    except Exception as e:
        logging.exception("[COCINA] ❌ Error al cargar pendientes: %s", e)
        return jsonify({"ok": False, "error": "Error al cargar pedidos pendientes"}), 500

# ✅ Cocina marca como listo
@pedidos.route("/pedido-listo/<int:pedido_id>", methods=["POST"])
def marcar_como_listo(pedido_id):
    try:
        ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE pedidos_listos SET hora_listo = ? WHERE pedido_id = ?", (ahora, pedido_id))
            conn.commit()
        logging.info(f"[COCINA] ✅ Pedido {pedido_id} listo")
        return jsonify({"ok": True})

    except Exception as e:
        logging.exception("[COCINA] ❌ Error al marcar listo: %s", e)
        return jsonify({"ok": False, "error": "Error al marcar como listo"}), 500

# ✅ Marcar recibido (mesero)
@pedidos.route("/pedido-recibido/<int:pedido_id>", methods=["POST"])
def marcar_pedido_recibido(pedido_id):
    try:
        ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT OR IGNORE INTO pedidos_recibidos (pedido_id, hora_recibido) VALUES (?, ?)", (pedido_id, ahora))
            cursor.execute("UPDATE pedidos SET estado = 'recibido' WHERE id = ?", (pedido_id,))
            conn.commit()
        logging.info(f"[MESERO] ✅ Pedido {pedido_id} recibido")
        return jsonify({"ok": True})

    except Exception as e:
        logging.exception("[MESERO] ❌ Error al marcar recibido: %s", e)
        return jsonify({"ok": False, "error": "Error al marcar como recibido"}), 500
