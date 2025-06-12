from flask import Blueprint, request, jsonify
from backend.db import get_db_connection
import logging

promociones_bp = Blueprint('promociones', __name__, url_prefix="/api")

# 📂 Logging avanzado (archivo + consola)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        #logging.FileHandler("backend/logs/app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# 📥 Obtener todas las promociones
# ------------------------------------------------------------------
@promociones_bp.route('/promociones', methods=['GET'])
def obtener_promociones():
    try:
        with get_db_connection() as conn:
            promociones = conn.execute('SELECT * FROM promociones').fetchall()
            logger.info(f"[PROMOCIONES] ✅ {len(promociones)} promociones obtenidas")
            return jsonify([dict(p) for p in promociones])
    except Exception:
        logger.exception("[PROMOCIONES] ❌ Error al obtener promociones")
        return jsonify({"error": "Error interno"}), 500

# ------------------------------------------------------------------
# ➕ Crear una nueva promoción
# ------------------------------------------------------------------
@promociones_bp.route('/promociones', methods=['POST'])
def crear_promocion():
    data = request.get_json()
    nombre = data.get('nombre')
    descripcion = data.get('descripcion')
    descuento = data.get('descuento')
    fecha_inicio = data.get('fecha_inicio')
    fecha_fin = data.get('fecha_fin')

    # 🔎 Validación de campos obligatorios
    if not all([nombre, descuento, fecha_inicio, fecha_fin]):
        logger.warning("[PROMOCIONES] ⚠️ Faltan campos obligatorios")
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    # 🎯 Validación de tipo de descuento
    try:
        descuento = float(descuento)
        if not (0 < descuento <= 100):
            raise ValueError
    except ValueError:
        logger.warning(f"[PROMOCIONES] ⚠️ Descuento inválido: {descuento}")
        return jsonify({'error': 'Descuento inválido'}), 400

    try:
        with get_db_connection() as conn:
            conn.execute("""
                INSERT INTO promociones (nombre, descripcion, descuento, fecha_inicio, fecha_fin)
                VALUES (?, ?, ?, ?, ?)
            """, (nombre, descripcion, descuento, fecha_inicio, fecha_fin))
            conn.commit()

        logger.info(f"[PROMOCIONES] ✅ Promoción creada: {nombre} ({descuento}% del {fecha_inicio} al {fecha_fin})")
        return jsonify({'mensaje': 'Promoción creada correctamente'}), 201

    except Exception:
        logger.exception("[PROMOCIONES] ❌ Error al crear promoción")
        return jsonify({'error': 'Error interno'}), 500

# ------------------------------------------------------------------
# ❌ Eliminar una promoción por ID
# ------------------------------------------------------------------
@promociones_bp.route('/promociones/<int:id>', methods=['DELETE'])
def eliminar_promocion(id):
    try:
        with get_db_connection() as conn:
            promo = conn.execute("SELECT * FROM promociones WHERE id = ?", (id,)).fetchone()

            if not promo:
                logger.warning(f"[PROMOCIONES] ❌ Intento de eliminar promoción inexistente | ID: {id}")
                return jsonify({'error': 'Promoción no encontrada'}), 404

            conn.execute("DELETE FROM promociones WHERE id = ?", (id,))
            conn.commit()

        logger.info(f"[PROMOCIONES] 🗑️ Promoción eliminada correctamente | ID: {id}")
        return jsonify({'mensaje': 'Promoción eliminada correctamente'})

    except Exception:
        logger.exception(f"[PROMOCIONES] ❌ Error al eliminar promoción ID {id}")
        return jsonify({'error': 'Error interno'}), 500
