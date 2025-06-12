import sqlite3
from datetime import datetime
from flask import Blueprint, request, jsonify
import logging
from backend.db import get_db_connection

cuentas = Blueprint("cuentas", __name__, url_prefix="/api/cuentas")

# 🪵 Configuración básica de logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 📋 Obtener todas las cuentas activas por mesero
@cuentas.route("", methods=["GET"])
def obtener_cuentas():
    mesero = request.args.get("mesero")

    if not mesero:
        logger.warning("[CUENTAS] ⚠️ Falta parámetro 'mesero'")
        return jsonify({"error": "Falta parámetro mesero"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT p.id, p.mesa,
                       COALESCE(SUM(i.cantidad * i.precio), 0) AS total
                FROM pedidos p
                JOIN items i ON p.id = i.pedido_id
                WHERE p.mesero = ?
                  AND p.estado != 'cerrado'
                GROUP BY p.id
            """, (mesero,))

            cuentas = [{
                "id": row["id"],
                "mesa": row["mesa"],
                "total": round(row["total"], 2),
                "propina": 0
            } for row in cursor.fetchall()]

            logger.info(f"[CUENTAS] ✅ {len(cuentas)} cuentas activas encontradas para mesero '{mesero}'")
            return jsonify(cuentas)

    except Exception:
        logger.exception("[CUENTAS] ❌ Error inesperado al obtener cuentas")
        return jsonify({"error": "Error interno"}), 500

# 💰 Cerrar cuenta
@cuentas.route("/cerrar", methods=["POST"])
def cerrar_cuenta():
    data = request.get_json()
    pedido_id = data.get("pedido_id")
    propina = data.get("propina", 0)
    mesero = data.get("mesero")

    if not pedido_id or not mesero:
        logger.warning("[CIERRE CUENTA] ⚠️ Datos requeridos faltantes")
        return jsonify({"error": "Faltan datos requeridos"}), 400

    try:
        propina = float(propina)
    except (ValueError, TypeError):
        logger.warning(f"[CIERRE CUENTA] ⚠️ Propina inválida: {propina}")
        return jsonify({"error": "Propina inválida"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            pedido = cursor.execute("""
                SELECT mesa FROM pedidos
                WHERE id = ? AND estado != 'cerrado'
            """, (pedido_id,)).fetchone()

            if not pedido:
                logger.warning(f"[CIERRE CUENTA] ❌ Pedido #{pedido_id} no encontrado o ya cerrado")
                return jsonify({"error": "Pedido no encontrado o ya cerrado"}), 404

            mesa = pedido["mesa"]

            # Calcular total
            items = cursor.execute("""
                SELECT nombre, cantidad, precio
                FROM items
                WHERE pedido_id = ?
            """, (pedido_id,)).fetchall()

            total = sum(row["cantidad"] * row["precio"] for row in items)
            fecha_hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Insertar cierre
            cursor.execute("""
                INSERT INTO cierre_cuentas (pedido_id, mesa, mesero, total, propina_total, fecha_hora)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (pedido_id, mesa, mesero, total, propina, fecha_hora))

            # Insertar detalle por cliente
            for item in items:
                cliente = item["nombre"] or "General"
                subtotal = item["cantidad"] * item["precio"]
                cursor.execute("""
                    INSERT INTO detalle_cierre (pedido_id, cliente, subtotal, propina)
                    VALUES (?, ?, ?, ?)
                """, (pedido_id, cliente, subtotal, 0))

            # Cerrar pedido
            cursor.execute("UPDATE pedidos SET estado = 'cerrado' WHERE id = ?", (pedido_id,))
            conn.commit()

            logger.info(f"[CIERRE CUENTA] ✅ Pedido #{pedido_id} cerrado correctamente por mesero '{mesero}'")
            return jsonify({"ok": True, "pedido_id": pedido_id})

    except Exception:
        logger.exception(f"[CUENTAS] ❌ Error cerrando cuenta del pedido #{pedido_id}")
        return jsonify({"error": "Error interno"}), 500
