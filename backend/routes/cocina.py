from flask import Blueprint, jsonify, request
from backend.db import get_db_connection
import datetime
import logging

# 📌 Blueprint con prefijo /api/cocina
cocina = Blueprint('cocina', __name__, url_prefix="/api/cocina")

# 🧾 Logging
logging.basicConfig(filename='logs/app.log', level=logging.INFO)

# 🔍 Obtener pedidos pendientes (no listos aún)
@cocina.route("/pedidos-pendientes", methods=["GET"])
def pedidos_pendientes():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.id, p.mesa, p.fecha, p.mesero
                FROM pedidos p
                LEFT JOIN pedidos_listos pl ON p.id = pl.pedido_id
                WHERE (pl.hora_listo IS NULL OR pl.hora_listo = '')
                  AND p.estado = 'pendiente'
                ORDER BY p.fecha ASC
            """)
            pedidos = cursor.fetchall()

            resultado = []
            for p in pedidos:
                pid = p["id"]
                cursor.execute("""
                    SELECT producto, cantidad FROM items WHERE pedido_id = ?
                """, (pid,))
                items = [dict(i) for i in cursor.fetchall()]

                resultado.append({
                    "id": pid,
                    "mesa": p["mesa"],
                    "fecha": p["fecha"],
                    "mesero": p["mesero"],
                    "items": items
                })

            # 🔔 Si hay nuevos pedidos pendientes, se puede emitir sonido del lado del cliente (polling)
            return jsonify({
                "ok": True,
                "nuevos": len(resultado),
                "pedidos": resultado
            })

    except Exception as e:
        logging.exception("[COCINA] ❌ Error obteniendo pedidos pendientes")
        return jsonify({"error": "Error interno"}), 500

# ✅ Marcar pedido como "listo" y registrar tiempo de preparación
@cocina.route("/pedido-listo/<int:pedido_id>", methods=["POST"])
def marcar_pedido_listo(pedido_id):
    try:
        ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Registrar hora de preparación
            cursor.execute("""
                INSERT OR REPLACE INTO pedidos_listos (pedido_id, hora_listo)
                VALUES (?, ?)
            """, (pedido_id, ahora))

            cursor.execute("UPDATE pedidos SET estado = 'listo' WHERE id = ?", (pedido_id,))

            # Obtener tiempo de preparación
            cursor.execute("SELECT fecha FROM pedidos WHERE id = ?", (pedido_id,))
            fila = cursor.fetchone()
            tiempo_inicio = datetime.datetime.strptime(fila["fecha"], "%Y-%m-%d %H:%M:%S")
            tiempo_final = datetime.datetime.strptime(ahora, "%Y-%m-%d %H:%M:%S")
            delta = tiempo_final - tiempo_inicio
            minutos = round(delta.total_seconds() / 60, 2)

            conn.commit()
            logging.info(f"[COCINA] ✅ Pedido {pedido_id} listo en {minutos} min")

            return jsonify({
                "ok": True,
                "pedido_id": pedido_id,
                "hora_listo": ahora,
                "tiempo_preparacion_min": minutos
            })

    except Exception as e:
        logging.exception("[COCINA] ❌ Error al marcar pedido como listo")
        return jsonify({"error": "No se pudo actualizar el pedido"}), 500
