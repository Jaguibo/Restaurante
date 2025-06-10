from flask import Blueprint, jsonify, request
from backend.db import get_db_connection
import datetime
import logging

# 📌 Blueprint con prefijo /api/cocina
cocina = Blueprint('cocina', __name__, url_prefix="/api/cocina")

# 🧾 Logger local
logger = logging.getLogger(__name__)

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
                cursor.execute("SELECT producto, cantidad FROM items WHERE pedido_id = ?", (p["id"],))
                items = [dict(i) for i in cursor.fetchall()]
                resultado.append({
                    "id": p["id"],
                    "mesa": p["mesa"],
                    "fecha": p["fecha"],
                    "mesero": p["mesero"],
                    "items": items
                })

            return jsonify({
                "ok": True,
                "nuevos": len(resultado),
                "pedidos": resultado
            })

    except Exception as e:
        logger.exception("[COCINA] ❌ Error obteniendo pedidos pendientes")
        return jsonify({"error": "Error interno"}), 500

# ✅ Marcar pedido como "listo" y registrar tiempo de preparación
@cocina.route("/pedido-listo/<int:pedido_id>", methods=["POST"])
def marcar_pedido_listo(pedido_id):
    try:
        ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Marcar como listo
            cursor.execute("""
                INSERT OR REPLACE INTO pedidos_listos (pedido_id, hora_listo)
                VALUES (?, ?)
            """, (pedido_id, ahora))

            cursor.execute("UPDATE pedidos SET estado = 'listo' WHERE id = ?", (pedido_id,))

            # Obtener tiempo de preparación
            cursor.execute("SELECT fecha FROM pedidos WHERE id = ?", (pedido_id,))
            fila = cursor.fetchone()

            if not fila:
                logger.warning(f"[COCINA] ⚠️ Pedido {pedido_id} no encontrado al calcular tiempo")
                return jsonify({"error": "Pedido no encontrado"}), 404

            fecha_inicio = datetime.datetime.strptime(fila["fecha"], "%Y-%m-%d %H:%M:%S")
            fecha_fin = datetime.datetime.strptime(ahora, "%Y-%m-%d %H:%M:%S")
            tiempo_min = round((fecha_fin - fecha_inicio).total_seconds() / 60, 2)

            # Guardar en métricas si la tabla existe
            try:
                cursor.execute("""
                    INSERT INTO pedido_metricas (pedido_id, tiempo_preparacion)
                    VALUES (?, ?)
                    ON CONFLICT(pedido_id) DO UPDATE SET tiempo_preparacion = excluded.tiempo_preparacion
                """, (pedido_id, int((fecha_fin - fecha_inicio).total_seconds())))
                logger.info(f"[COCINA] 🕒 Tiempo preparación guardado para pedido {pedido_id}")
            except Exception:
                logger.warning(f"[COCINA] ⚠️ No se guardó métrica de tiempo (¿tabla no existe?)")

            conn.commit()
            logger.info(f"[COCINA] ✅ Pedido {pedido_id} marcado como listo")

            return jsonify({
                "ok": True,
                "pedido_id": pedido_id,
                "hora_listo": ahora,
                "tiempo_preparacion_min": tiempo_min
            })

    except Exception as e:
        logger.exception("[COCINA] ❌ Error al marcar pedido como listo")
        return jsonify({"error": "No se pudo actualizar el pedido"}), 500
