# backend/routes/productos.py
from flask import Blueprint, jsonify
from backend.db import get_db_connection
import logging

productos_bp = Blueprint("productos", __name__, url_prefix="/api")

# 📂 Logging avanzado
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
# 🍽️ Obtener productos agrupados por categoría
# ------------------------------------------------------------------
@productos_bp.route("/productos-agrupados", methods=["GET"])
def obtener_productos_agrupados():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            productos = cursor.execute("SELECT nombre, precio, categoria FROM productos").fetchall()

            agrupados = {}
            for p in productos:
                categoria = p["categoria"] or "Otros"
                if not p["categoria"]:
                    logger.warning(f"[PRODUCTOS] Producto sin categoría asignada: {p['nombre']} → asignado a 'Otros'")

                if categoria not in agrupados:
                    agrupados[categoria] = []

                agrupados[categoria].append({
                    "nombre": p["nombre"],
                    "precio": p["precio"]
                })

            logger.info(f"[PRODUCTOS] ✅ {len(productos)} productos obtenidos y agrupados en {len(agrupados)} categorías.")
            return jsonify(agrupados)

    except Exception:
        logger.exception("[PRODUCTOS] ❌ Error al obtener productos agrupados")
        return jsonify({"error": "No se pudieron obtener los productos"}), 500
