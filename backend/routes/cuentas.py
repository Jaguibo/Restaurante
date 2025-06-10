import sqlite3
from datetime import datetime
from flask import Blueprint, request, jsonify
import logging
from backend.db import get_db_connection

cuentas = Blueprint("cuentas", __name__, url_prefix="/api/cuentas")

logging.basicConfig(filename='logs/app.log', level=logging.INFO)


@cuentas.route("", methods=["GET"])
def obtener_cuentas():
    mesero = request.args.get("mesero")
    if not mesero:
        logging.warning("[CUENTAS] Falta parámetro 'mesero' en GET /cuentas")
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
            rows = cursor.fetchall()

            cuentas = [{
                "id": row["id"],
                "mesa": row["mesa"],
                "total": round(row["total"], 2),
                "propina": 0
            } for row in rows]

            logging.info(f"[CUENTAS] ✅ Cuentas abiertas para '{mesero}': {len(cuentas)}")
            return jsonify(cuentas)

    except Exception as e:
        logging.exception("[CUENTAS] ❌ Error al obtener cuentas")
        return jsonify({"error": "Error interno"}), 500


@cuentas.route("/cerrar", methods=["POST"])
def cerrar_cuenta():
    data = request.get_json()
    pedido_id = data.get("pedido_id")
    propina = data.get("propina", 0)
    mesero = data.get("mesero")

    if not pedido_id or not mesero:
        return jsonify({"error": "Faltan datos requeridos"}), 400

    try:
        propina = float(propina)
    except:
        return jsonify({"error": "Propina inválida"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            pedido = cursor.execute("""
                SELECT mesa FROM pedidos
                WHERE id = ? AND estado != 'cerrado'
            """, (pedido_id,)).fetchone()

            if not pedido:
                return jsonify({"error": "Pedido no encontrado o ya cerrado"}), 404

            mesa = pedido["mesa"]

            # Calcular total
            cursor.execute("""
                SELECT nombre, cantidad, precio
                FROM items
                WHERE pedido_id = ?
            """, (pedido_id,))
            items = cursor.fetchall()

            total = sum(row["cantidad"] * row["precio"] for row in items)
            fecha_hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Guardar en cierre_cuentas
            cursor.execute("""
                INSERT INTO cierre_cuentas (pedido_id, mesa, mesero, total, propina_total, fecha_hora)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (pedido_id, mesa, mesero, total, propina, fecha_hora))

            # Guardar detalle por cliente (si no hay nombre, usar "General")
            for item in items:
                cursor.execute("""
                    INSERT INTO detalle_cierre (pedido_id, cliente, subtotal, propina)
                    VALUES (?, ?, ?, ?)
                """, (pedido_id, item["nombre"] or "General", item["cantidad"] * item["precio"], 0))

            cursor.execute("UPDATE pedidos SET estado = 'cerrado' WHERE id = ?", (pedido_id,))
            conn.commit()

            logging.info(f"[CIERRE CUENTA] ✅ Pedido #{pedido_id} cerrado por {mesero}")
            return jsonify({"ok": True, "pedido_id": pedido_id})

    except Exception as e:
        logging.exception("[CUENTAS] ❌ Error al cerrar cuenta")
        return jsonify({"error": "Error interno"}), 500
