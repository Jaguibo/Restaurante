# rutas/productos.py
from flask import Blueprint, jsonify
from backend.db import get_db_connection

productos_bp = Blueprint("productos", __name__)

@productos_bp.route("/api/productos-agrupados", methods=["GET"])
def obtener_productos_agrupados():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            productos = cursor.execute("SELECT nombre, precio, categoria FROM productos").fetchall()

            agrupados = {}
            for p in productos:
                categoria = p["categoria"] or "Otros"
                if categoria not in agrupados:
                    agrupados[categoria] = []
                agrupados[categoria].append({
                    "nombre": p["nombre"],
                    "precio": p["precio"]
                })

        return jsonify(agrupados)

    except Exception as e:
        print("❌ Error al obtener productos agrupados:", e)
        return jsonify({"error": "No se pudieron obtener los productos"}), 500
