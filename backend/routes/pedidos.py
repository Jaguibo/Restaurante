from flask import Blueprint, request, jsonify, session
from backend.db import get_db_connection
import logging
import datetime
import os
import sqlite3

# 📁 Setup de logs (crea la carpeta si no existe)
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    filename="logs/app.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

pedidos = Blueprint('pedidos', __name__, url_prefix="/api")

# 📌 Registro de un nuevo pedido
@pedidos.route("/pedidos", methods=["POST"])
def registrar_pedido():
    if session.get("rol") != "mesero":
        logger.warning("[PEDIDO] ❌ Acceso denegado: solo meseros pueden registrar pedidos")
        return jsonify({"ok": False, "error": "No autorizado"}), 403

    data = request.get_json()
    mesa = data.get("mesa")
    cuenta = data.get("cuenta")
    items = data.get("items", [])
    mesero = data.get("mesero")
    fecha = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if not all([mesa, cuenta, items, mesero]):
        logger.warning("[PEDIDO] ❌ Datos incompletos para registrar pedido")
        return jsonify({"ok": False, "error": "Faltan datos"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # 📥 Insertar pedido
            cursor.execute("""
                INSERT INTO pedidos (mesa, cuenta, mesero, fecha, estado)
                VALUES (?, ?, ?, ?, 'pendiente')
            """, (mesa, cuenta, mesero, fecha))
            pedido_id = cursor.lastrowid

            for item in items:
                nombre = item.get("nombre")
                producto = item.get("producto")
                cantidad = item.get("cantidad", 1)

                if not producto or not isinstance(cantidad, int):
                    logger.warning(f"[PEDIDO] ⚠️ Item inválido: {item}")
                    continue

                precio_row = cursor.execute(
                    "SELECT precio FROM productos WHERE nombre = ?",
                    (producto,)
                ).fetchone()
                precio = precio_row["precio"] if precio_row else 0

                cursor.execute("""
                    INSERT INTO items (pedido_id, nombre, producto, cantidad, precio)
                    VALUES (?, ?, ?, ?, ?)
                """, (pedido_id, nombre, producto, cantidad, precio))

            conn.commit()
            logger.info(f"[PEDIDO] ✅ Pedido #{pedido_id} registrado exitosamente")
            return jsonify({"ok": True, "id_pedido": pedido_id})

    except Exception:
        logger.exception("[PEDIDO] ❌ Error inesperado al registrar pedido")
        return jsonify({"ok": False, "error": "Error interno"}), 500
# ✅ Listar mesas disponibles
@pedidos.route("/mesas", methods=["GET"])
def obtener_mesas():
    if session.get("rol") != "mesero":
        logger.warning("[MESAS] ❌ Acceso denegado: solo meseros pueden ver mesas")
        return jsonify({"ok": False, "error": "No autorizado"}), 403

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            mesas = cursor.execute("SELECT nombre FROM mesas").fetchall()
            lista = [row["nombre"] for row in mesas]
            logger.info(f"[MESAS] ✅ Se obtuvo la lista de mesas: {lista}")
            return jsonify(lista)
    except Exception:
        logger.exception("[MESAS] ❌ Error al obtener mesas")
        return jsonify({"ok": False, "error": "Error interno"}), 500


# 🧾 Listar pedido activo por mesa
@pedidos.route("/pedido/<mesa>", methods=["GET"])
def obtener_pedido_por_mesa(mesa):
    if session.get("rol") != "mesero":
        logger.warning(f"[PEDIDO] ❌ Acceso denegado a pedido de mesa {mesa}")
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
                logger.warning(f"[PEDIDO] ⚠️ No hay pedido activo para mesa {mesa}")
                return jsonify({"ok": False, "error": "No hay pedido activo"}), 404

            items = cursor.execute("""
                SELECT nombre, producto, cantidad, precio
                FROM items WHERE pedido_id = ?
            """, (pedido["id"],)).fetchall()

            logger.info(f"[PEDIDO] ✅ Pedido activo de mesa {mesa} obtenido (ID: {pedido['id']})")
            return jsonify({
                "id": pedido["id"],
                "mesa": mesa,
                "cuenta": pedido["cuenta"],
                "items": [dict(row) for row in items]
            })

    except Exception:
        logger.exception(f"[PEDIDO] ❌ Error al obtener pedido de mesa {mesa}")
        return jsonify({"ok": False, "error": "Error interno"}), 500


# ✅ Marcar pedido como listo y guardar métrica
@pedidos.route("/pedido-listo/<int:pedido_id>", methods=["POST"])
def marcar_como_listo(pedido_id):
    try:
        ahora = datetime.datetime.now()
        ahora_str = ahora.strftime("%Y-%m-%d %H:%M:%S")

        with get_db_connection() as conn:
            cursor = conn.cursor()
            pedido = cursor.execute("SELECT fecha FROM pedidos WHERE id = ?", (pedido_id,)).fetchone()
            if not pedido:
                logger.warning(f"[COCINA] ❌ Pedido {pedido_id} no encontrado")
                return jsonify({"error": "Pedido no encontrado"}), 404

            try:
                inicio = datetime.datetime.strptime(pedido["fecha"], "%Y-%m-%d %H:%M:%S")
            except ValueError:
                inicio = datetime.datetime.strptime(pedido["fecha"], "%Y-%m-%d")

            duracion = int((ahora - inicio).total_seconds())

            cursor.execute("""
                INSERT OR REPLACE INTO pedidos_listos (pedido_id, hora_listo)
                VALUES (?, ?)
            """, (pedido_id, ahora_str))
            cursor.execute("UPDATE pedidos SET estado = 'listo' WHERE id = ?", (pedido_id,))

            try:
                cursor.execute("""
                    INSERT INTO pedido_metricas (pedido_id, tiempo_preparacion)
                    VALUES (?, ?)
                """, (pedido_id, duracion))
            except sqlite3.OperationalError:
                logger.warning("[COCINA] ⚠️ Tabla 'pedido_metricas' no existe")

            conn.commit()
            logger.info(f"[COCINA] ✅ Pedido {pedido_id} marcado como listo en {duracion}s")
            return jsonify({"ok": True})

    except Exception:
        logger.exception("[COCINA] ❌ Error al marcar pedido como listo")
        return jsonify({"ok": False, "error": "Error interno"}), 500
# ✅ Marcar pedido como recibido por mesero
@pedidos.route("/pedido-recibido/<int:pedido_id>", methods=["POST"])
def marcar_pedido_recibido(pedido_id):
    try:
        ahora = datetime.datetime.now()
        ahora_str = ahora.strftime("%Y-%m-%d %H:%M:%S")

        with get_db_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                INSERT OR IGNORE INTO pedidos_recibidos (pedido_id, hora_recibido)
                VALUES (?, ?)
            """, (pedido_id, ahora_str))

            cursor.execute("UPDATE pedidos SET estado = 'recibido' WHERE id = ?", (pedido_id,))

            try:
                listo = cursor.execute("""
                    SELECT hora_listo FROM pedidos_listos WHERE pedido_id = ?
                """, (pedido_id,)).fetchone()
                if listo and listo["hora_listo"]:
                    inicio = datetime.datetime.strptime(listo["hora_listo"], "%Y-%m-%d %H:%M:%S")
                    entrega = int((ahora - inicio).total_seconds())
                    cursor.execute("""
                        UPDATE pedido_metricas SET tiempo_entrega = ?
                        WHERE pedido_id = ?
                    """, (entrega, pedido_id))
            except sqlite3.OperationalError:
                logger.warning(f"[MESERO] ⚠️ No se pudo guardar métrica de entrega (tabla no existe)")

            conn.commit()
            logger.info(f"[MESERO] ✅ Pedido {pedido_id} marcado como recibido")
            return jsonify({"ok": True})

    except Exception:
        logger.exception("[MESERO] ❌ Error al marcar como recibido")
        return jsonify({"ok": False, "error": "Error interno"}), 500


# 📦 Pedidos listos para entregar
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
                WHERE p.estado IN ('pendiente', 'listo') AND pl.hora_listo IS NOT NULL
                  AND p.id NOT IN (SELECT pedido_id FROM pedidos_recibidos)
                ORDER BY p.id
            """)
            pedidos = {}
            for row in cursor.fetchall():
                pid = row["id"]
                pedidos.setdefault(pid, {
                    "id": pid,
                    "mesa": row["mesa"],
                    "cuenta": row["cuenta"],
                    "items": []
                })["items"].append({
                    "nombre": row["nombre"],
                    "producto": row["producto"],
                    "cantidad": row["cantidad"],
                    "precio": row["precio"]
                })

            logger.info(f"[PEDIDO] ✅ {len(pedidos)} pedidos listos obtenidos")
            return jsonify(list(pedidos.values()))

    except Exception:
        logger.exception("[PEDIDO] ❌ Error al obtener pedidos listos")
        return jsonify({"ok": False, "error": "Error interno"}), 500


# ⏳ Pedidos pendientes para cocina
@pedidos.route("/pedidos-pendientes", methods=["GET"])
def obtener_pedidos_pendientes():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.id, p.mesa, p.fecha, i.nombre, i.producto, i.cantidad, i.precio
                FROM pedidos p
                JOIN items i ON p.id = i.pedido_id
                WHERE p.estado = 'pendiente'
                ORDER BY p.fecha ASC, p.id ASC
            """)

            pedidos = {}
            for row in cursor.fetchall():
                pid = row["id"]
                if pid not in pedidos:
                    pedidos[pid] = {
                        "id": pid,
                        "mesa": row["mesa"],
                        "fecha_hora": row["fecha"],
                        "items": []
                    }
                pedidos[pid]["items"].append({
                    "nombre": row["nombre"],
                    "producto": row["producto"],
                    "cantidad": row["cantidad"],
                    "precio": row["precio"]
                })

            logger.info(f"[COCINA] ✅ {len(pedidos)} pedidos pendientes obtenidos")
            return jsonify(list(pedidos.values()))

    except Exception:
        logger.exception("[COCINA] ❌ Error al obtener pendientes")
        return jsonify({"ok": False, "error": "Error interno"}), 500
