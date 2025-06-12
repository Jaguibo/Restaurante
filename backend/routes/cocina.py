from flask import Blueprint, jsonify, request
from backend.db import get_db_connection
import datetime
import logging

# 📌 Blueprint con prefijo /api/cocina
cocina = Blueprint('cocina', __name__, url_prefix="/api/cocina")

# 🧾 Logger local (hereda configuración global)
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

            logger.info(f"[COCINA] ✅ {len(resultado)} pedidos pendientes obtenidos")
            return jsonify({
                "ok": True,
                "nuevos": len(resultado),
                "pedidos": resultado
            })

    except Exception:
        logger.exception("[COCINA] ❌ Error obteniendo pedidos pendientes")
        return jsonify({"error": "Error interno"}), 500

# ✅ Marcar pedido como "listo" y registrar tiempo de preparación
@cocina.route("/pedido-listo/<int:pedido_id>", methods=["POST"])
def marcar_pedido_listo(pedido_id):
    try:
        ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Obtener fecha original del pedido
            cursor.execute("SELECT fecha FROM pedidos WHERE id = ?", (pedido_id,))
            fila = cursor.fetchone()

            if not fila:
                logger.warning(f"[COCINA] ⚠️ Pedido {pedido_id} no encontrado para marcar como listo")
                return jsonify({"error": "Pedido no encontrado"}), 404

            # Calcular duración
            fecha_inicio = datetime.datetime.strptime(fila["fecha"], "%Y-%m-%d %H:%M:%S")
            fecha_fin = datetime.datetime.strptime(ahora, "%Y-%m-%d %H:%M:%S")
            duracion_segundos = int((fecha_fin - fecha_inicio).total_seconds())
            duracion_min = round(duracion_segundos / 60, 2)

            # Marcar como listo
            cursor.execute("""
                INSERT OR REPLACE INTO pedidos_listos (pedido_id, hora_listo)
                VALUES (?, ?)
            """, (pedido_id, ahora))

            cursor.execute("UPDATE pedidos SET estado = 'listo' WHERE id = ?", (pedido_id,))

            # Guardar en métricas si aplica
            try:
                cursor.execute("""
                    INSERT INTO pedido_metricas (pedido_id, tiempo_preparacion)
                    VALUES (?, ?)
                    ON CONFLICT(pedido_id) DO UPDATE SET tiempo_preparacion = excluded.tiempo_preparacion
                """, (pedido_id, duracion_segundos))
                logger.info(f"[COCINA] 🕒 Tiempo preparación ({duracion_segundos}s) guardado para pedido {pedido_id}")
            except Exception:
                logger.warning(f"[COCINA] ⚠️ No se guardó métrica (¿tabla inexistente?) para pedido {pedido_id}")

            conn.commit()
            logger.info(f"[COCINA] ✅ Pedido {pedido_id} marcado como listo")

            return jsonify({
                "ok": True,
                "pedido_id": pedido_id,
                "hora_listo": ahora,
                "tiempo_preparacion_min": duracion_min
            })

    except Exception:
        logger.exception("[COCINA] ❌ Error al marcar pedido como listo")
        return jsonify({"error": "No se pudo actualizar el pedido"}), 500
