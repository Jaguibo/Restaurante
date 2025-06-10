from flask import Blueprint, request, jsonify, session, Response
from backend.db import get_db_connection
import logging
import datetime

ventas = Blueprint('ventas', __name__, url_prefix="/api")

# 📝 Configura logging
logging.basicConfig(
    filename='logs/app.log',
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# ------------------------------------------------------------------------------
# 📦 1. Obtener el último pedido activo por mesa
# ------------------------------------------------------------------------------
@ventas.route("/pedido/<mesa>", methods=["GET"])
def obtener_pedido(mesa):
    conn = get_db_connection()
    try:
        pedido = conn.execute(
            "SELECT * FROM pedidos WHERE mesa = ? AND estado != 'cerrado' ORDER BY id DESC LIMIT 1",
            (mesa,)
        ).fetchone()

        if not pedido:
            logging.warning(f"[PEDIDO] ❌ No hay pedidos activos para mesa '{mesa}'")
            return jsonify({"ok": False, "error": "No hay pedidos activos para esta mesa"}), 404

        items = conn.execute(
            "SELECT * FROM items WHERE pedido_id = ?",
            (pedido["id"],)
        ).fetchall()

        logging.info(f"[PEDIDO] ✅ Pedido activo encontrado para mesa {mesa}")
        return jsonify({
            "ok": True,
            "id": pedido["id"],
            "mesa": pedido["mesa"],
            "cuenta": pedido["cuenta"],
            "mesero": pedido["mesero"],
            "fecha": pedido["fecha"],
            "estado": pedido["estado"],
            "items": [dict(i) for i in items]
        })
    except Exception as e:
        logging.exception("[PEDIDO] ❌ Error al obtener pedido")
        return jsonify({"ok": False, "error": "Error interno"}), 500
    finally:
        conn.close()

# ------------------------------------------------------------------------------
# 💰 2. Cerrar una cuenta
# ------------------------------------------------------------------------------
@ventas.route("/cerrar-cuenta", methods=["POST"])
def cerrar_cuenta():
    if session.get("rol") != "mesero":
        return jsonify({"ok": False, "error": "No autorizado"}), 403

    data = request.get_json()
    campos = ["mesa", "pedido_id", "total", "mesero", "detalle"]
    if not all(k in data for k in campos):
        logging.warning("[CUENTA] ❌ Faltan campos requeridos")
        return jsonify({"ok": False, "error": "Datos incompletos"}), 400

    try:
        total = float(data["total"])
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "Total inválido"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Verifica si el pedido aún no está cerrado
        pedido = cursor.execute(
            "SELECT id FROM pedidos WHERE id = ? AND estado != 'cerrado'",
            (data["pedido_id"],)
        ).fetchone()

        if not pedido:
            return jsonify({"ok": False, "error": "Pedido ya cerrado o no existe"}), 404

        propina_total = sum(float(d.get("propina", 0)) for d in data["detalle"])
        fecha_cierre = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
            INSERT INTO cierre_cuentas (pedido_id, mesa, total, fecha_hora, propina_total, mesero)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (data["pedido_id"], data["mesa"], total, fecha_cierre, propina_total, data["mesero"]))

        cursor.execute("UPDATE pedidos SET estado = 'cerrado' WHERE id = ?", (data["pedido_id"],))
        conn.commit()

        logging.info(f"[CUENTA] ✅ Mesa {data['mesa']} cerrada | Total: ${total:.2f} | Propina: ${propina_total:.2f}")
        return jsonify({"ok": True, "fecha_cierre": fecha_cierre})
    except Exception:
        conn.rollback()
        logging.exception("[CUENTA] ❌ Error cerrando cuenta")
        return jsonify({"ok": False, "error": "Error interno"}), 500
    finally:
        conn.close()

# ------------------------------------------------------------------------------
# 📊 3. Resumen diario
# ------------------------------------------------------------------------------
@ventas.route("/ventas-dia", methods=["GET"])
def resumen_diario():
    if session.get("rol") not in ["admin", "gerente"]:
        return jsonify({"error": "No autorizado"}), 403

    try:
        conn = get_db_connection()
        conn.row_factory = lambda cursor, row: {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
        cursor = conn.cursor()

        cursor.execute("""
            SELECT COUNT(*) AS total_ventas,
                   COALESCE(SUM(total), 0) AS monto_total,
                   COALESCE(SUM(propina_total), 0) AS total_propinas,
                   COUNT(DISTINCT mesa) AS mesas_atendidas,
                   GROUP_CONCAT(DISTINCT mesero) AS meseros
            FROM cierre_cuentas
            WHERE DATE(fecha_hora) = DATE('now')
        """)
        resumen = cursor.fetchone() or {}

        cursor.execute("""
            SELECT strftime('%H', fecha_hora) AS hora,
                   COUNT(*) AS cantidad,
                   SUM(total) AS monto
            FROM cierre_cuentas
            WHERE DATE(fecha_hora) = DATE('now')
            GROUP BY hora ORDER BY hora
        """)
        ventas_por_hora = cursor.fetchall()

        cursor.execute("""
            SELECT c.id, p.mesa, c.total, c.propina_total AS propina,
                   c.mesero, strftime('%H:%M', c.fecha_hora) AS hora
            FROM cierre_cuentas c
            JOIN pedidos p ON c.pedido_id = p.id
            WHERE DATE(c.fecha_hora) = DATE('now')
            ORDER BY c.fecha_hora DESC
            LIMIT 5
        """)
        ultimas_ventas = cursor.fetchall()

        cursor.execute("""
            SELECT COUNT(*) AS total_activos,
                   GROUP_CONCAT(DISTINCT mesa) AS mesas_activas
            FROM pedidos
            WHERE estado != 'cerrado'
        """)
        activos = cursor.fetchone() or {}

        return jsonify({
            "ok": True,
            "resumen": {
                "total_ventas": resumen.get("total_ventas", 0),
                "monto_total": float(resumen.get("monto_total", 0)),
                "total_propinas": float(resumen.get("total_propinas", 0)),
                "mesas_atendidas": resumen.get("mesas_atendidas", 0),
                "meseros": resumen.get("meseros", "").split(",") if resumen.get("meseros") else []
            },
            "ventas_por_hora": ventas_por_hora,
            "ultimas_ventas": ultimas_ventas,
            "pedidos_activos": {
                "total": activos.get("total_activos", 0),
                "mesas": activos.get("mesas_activas", "").split(",") if activos.get("mesas_activas") else []
            }
        })
    except Exception:
        logging.exception("[RESUMEN] ❌ Error en resumen diario")
        return jsonify({"ok": False, "error": "Error al generar resumen"}), 500
    finally:
        conn.close()

# ------------------------------------------------------------------------------
# 📅 4. Ventas por rango
# ------------------------------------------------------------------------------
@ventas.route("/ventas-rango", methods=["GET"])
def ventas_por_rango():
    if session.get("rol") not in ["admin", "gerente"]:
        return jsonify({"error": "No autorizado"}), 403

    fecha_inicio = request.args.get("inicio")
    fecha_fin = request.args.get("fin")

    if not fecha_inicio or not fecha_fin:
        return jsonify({"error": "Fechas requeridas"}), 400

    try:
        conn = get_db_connection()
        conn.row_factory = lambda cursor, row: {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DATE(fecha_cierre) AS fecha,
                   COUNT(*) AS ventas,
                   SUM(total) AS monto, 
                   SUM(propina_total) AS propinas
            FROM cierre_cuentas
            WHERE DATE(fecha_cierre) BETWEEN ? AND ?
            GROUP BY fecha
            ORDER BY fecha
        """, (fecha_inicio, fecha_fin))

        resultados = cursor.fetchall()
        return jsonify({"ok": True, "ventas": resultados})
    except Exception:
        logging.exception("[RANGO] ❌ Error en ventas por rango")
        return jsonify({"ok": False, "error": "Error al consultar ventas"}), 500
    finally:
        conn.close()

# ------------------------------------------------------------------------------
# 📤 5. Exportar CSV avanzado (rango con filtro opcional)
# ------------------------------------------------------------------------------
@ventas.route("/exportar-ventas-csv-avanzado", methods=["GET"])
def exportar_ventas_csv_avanzado():
    if session.get("rol") not in ["admin", "gerente"]:
        return jsonify({"error": "No autorizado"}), 403

    try:
        fecha_inicio = request.args.get("inicio")
        fecha_fin = request.args.get("fin")
        mesero = request.args.get("mesero")

        if not fecha_inicio or not fecha_fin:
            return jsonify({"error": "Fechas requeridas"}), 400

        conn = get_db_connection()
        conn.row_factory = lambda cursor, row: {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
        cursor = conn.cursor()

        sql = """
            SELECT c.id AS id_venta, c.pedido_id, p.mesa,
                   c.total, c.propina_total, c.mesero, c.fecha_hora
            FROM cierre_cuentas c
            JOIN pedidos p ON c.pedido_id = p.id
            WHERE DATE(c.fecha_hora) BETWEEN ? AND ?
        """
        params = [fecha_inicio, fecha_fin]

        if mesero:
            sql += " AND c.mesero = ?"
            params.append(mesero)

        sql += " ORDER BY c.fecha_hora DESC"

        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()

        headers = ["ID Venta", "ID Pedido", "Mesa", "Total", "Propina", "Mesero", "Fecha Hora"]

        def generar_csv():
            yield '\ufeff'
            yield ",".join(headers) + "\n"
            for row in rows:
                yield ",".join(str(row.get(h.lower().replace(" ", "_"), "")) for h in headers) + "\n"

        filename = f"ventas_{fecha_inicio}_a_{fecha_fin}.csv"
        return Response(
            generar_csv(),
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}; charset=utf-8"}
        )

    except Exception:
        logging.exception("[CSV AVANZADO] ❌ Error al exportar CSV")
        return jsonify({"ok": False, "error": "Error exportando CSV"}), 500
    finally:
        conn.close()


# ------------------------------------------------------------------------------
# 📤 6. Exportar ventas de HOY (rápido)
# ------------------------------------------------------------------------------
@ventas.route("/exportar-ventas-csv", methods=["GET"])
def exportar_ventas_csv_hoy():
    if session.get("rol") not in ["admin", "gerente"]:
        return jsonify({"error": "No autorizado"}), 403

    try:
        conn = get_db_connection()
        conn.row_factory = lambda cursor, row: {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
        cursor = conn.cursor()

        cursor.execute("""
            SELECT c.id AS id_venta, c.pedido_id, p.mesa,
                   c.total, c.propina_total, c.mesero, c.fecha_hora
            FROM cierre_cuentas c
            JOIN pedidos p ON c.pedido_id = p.id
            WHERE DATE(c.fecha_hora) = DATE('now')
            ORDER BY c.fecha_hora DESC
        """)
        rows = cursor.fetchall()

        headers = ["ID Venta", "ID Pedido", "Mesa", "Total", "Propina", "Mesero", "Fecha Hora"]

        def generar_csv():
            yield '\ufeff'  # BOM para Excel
            yield ",".join(headers) + "\n"
            for row in rows:
                yield ",".join(str(row.get(h.lower().replace(" ", "_"), "")) for h in headers) + "\n"

        filename = f"ventas_{datetime.date.today()}.csv"
        return Response(
            generar_csv(),
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}; charset=utf-8"}
        )
    except Exception:
        logging.exception("[CSV HOY] ❌ Error al exportar CSV HOY")
        return jsonify({"ok": False, "error": "Error exportando CSV"}), 500
    finally:
        conn.close()

