from flask import Blueprint, request, jsonify
from backend.db import get_db_connection
import logging

promociones_bp = Blueprint('promociones', __name__, url_prefix="/api")

# 📂 Logging
logging.basicConfig(filename='logs/app.log', level=logging.INFO)
logger = logging.getLogger(__name__)

# 📥 Obtener todas las promociones
@promociones_bp.route('/promociones', methods=['GET'])
def obtener_promociones():
    try:
        with get_db_connection() as conn:
            promociones = conn.execute('SELECT * FROM promociones').fetchall()
            return jsonify([dict(p) for p in promociones])
    except Exception as e:
        logger.exception("[PROMOCIONES] ❌ Error al obtener promociones")
        return jsonify({"error": "Error interno"}), 500

# ➕ Crear una nueva promoción
@promociones_bp.route('/promociones', methods=['POST'])
def crear_promocion():
    data = request.get_json()
    nombre = data.get('nombre')
    descripcion = data.get('descripcion')
    descuento = data.get('descuento')
    fecha_inicio = data.get('fecha_inicio')
    fecha_fin = data.get('fecha_fin')

    if not all([nombre, descuento, fecha_inicio, fecha_fin]):
        logger.warning("[PROMOCIONES] ⚠️ Campos faltantes al crear promoción")
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    try:
        with get_db_connection() as conn:
            conn.execute("""
                INSERT INTO promociones (nombre, descripcion, descuento, fecha_inicio, fecha_fin)
                VALUES (?, ?, ?, ?, ?)
            """, (nombre, descripcion, descuento, fecha_inicio, fecha_fin))
            conn.commit()
        logger.info(f"[PROMOCIONES] ✅ Promoción '{nombre}' creada")
        return jsonify({'mensaje': 'Promoción creada correctamente'}), 201

    except Exception as e:
        logger.exception("[PROMOCIONES] ❌ Error al crear promoción")
        return jsonify({'error': 'Error interno'}), 500

# ❌ Eliminar promoción
@promociones_bp.route('/promociones/<int:id>', methods=['DELETE'])
def eliminar_promocion(id):
    try:
        with get_db_connection() as conn:
            promo = conn.execute("SELECT * FROM promociones WHERE id = ?", (id,)).fetchone()
            if not promo:
                logger.warning(f"[PROMOCIONES] ❌ Intento de eliminar promoción inexistente ID {id}")
                return jsonify({'error': 'Promoción no encontrada'}), 404

            conn.execute("DELETE FROM promociones WHERE id = ?", (id,))
            conn.commit()
        logger.info(f"[PROMOCIONES] ✅ Promoción ID {id} eliminada")
        return jsonify({'mensaje': 'Promoción eliminada correctamente'})

    except Exception as e:
        logger.exception(f"[PROMOCIONES] ❌ Error al eliminar promoción ID {id}")
        return jsonify({'error': 'Error interno'}), 500
