# backend/routes/ventas.py
from flask import Blueprint, request, jsonify, session, Response
from backend.db import get_db_connection
import logging
import datetime

ventas = Blueprint('ventas', __name__, url_prefix="/api")

# 📅 Logging mejorado con consola + archivo
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler("backend/logs/app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 🔒 Requiere rol admin o gerente
def requiere_admin_o_gerente():
    rol = session.get("rol")
    if rol not in ["admin", "gerente"]:
        logger.warning(f"[ACCESO DENEGADO] Intento de acceso con rol: {rol}")
        return False
    return True

# ------------------------------------------------------------------
# 📦 Obtener pedido activo por mesa
# ------------------------------------------------------------------
@ventas.route("/pedido/<mesa>", methods=["GET"])
def obtener_pedido(mesa):
    try:
        with get_db_connection() as conn:
            pedido = conn.execute("""
                SELECT * FROM pedidos
                WHERE mesa = ? AND estado != 'cerrado'
                ORDER BY id DESC LIMIT 1
            """, (mesa,)).fetchone()

            if not pedido:
                logger.warning(f"[PEDIDO] No hay pedido activo para mesa {mesa}")
                return jsonify({"ok": False, "error": "No hay pedidos activos"}), 404

            items = conn.execute("""
                SELECT * FROM items WHERE pedido_id = ?
            """, (pedido["id"],)).fetchall()

            logger.info(f"[PEDIDO] Pedido activo obtenido para mesa {mesa} | ID: {pedido['id']}")
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
        logger.exception("[VENTAS] ❌ Error al obtener pedido")
        return jsonify({"ok": False, "error": "Error interno"}), 500

# ------------------------------------------------------------------
# 💰 Cerrar cuenta
# ------------------------------------------------------------------
@ventas.route("/cerrar-cuenta", methods=["POST"])
def cerrar_cuenta():
    if session.get("rol") != "mesero":
        logger.warning("[CIERRE] Acceso denegado: solo mesero puede cerrar cuentas")
        return jsonify({"ok": False, "error": "No autorizado"}), 403

    data = request.get_json()
    campos = ["mesa", "pedido_id", "total", "mesero", "detalle"]
    if not all(c in data for c in campos):
        logger.warning(f"[CIERRE] Faltan campos requeridos: {data}")
        return jsonify({"ok": False, "error": "Faltan datos"}), 400

    try:
        total = float(data["total"])
    except ValueError:
        logger.warning(f"[CIERRE] Total inválido: {data['total']}")
        return jsonify({"ok": False, "error": "Total inválido"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            pedido = cursor.execute("""
                SELECT id FROM pedidos
                WHERE id = ? AND estado != 'cerrado'
            """, (data["pedido_id"],)).fetchone()

            if not pedido:
                logger.warning(f"[CIERRE] Pedido inexistente o ya cerrado | ID: {data['pedido_id']}")
                return jsonify({"ok": False, "error": "Pedido no existe o ya cerrado"}), 404

            propina_total = sum(float(d.get("propina", 0)) for d in data["detalle"])
            fecha_cierre = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute("""
                INSERT INTO cierre_cuentas (pedido_id, mesa, total, fecha_hora, propina_total, mesero)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (data["pedido_id"], data["mesa"], total, fecha_cierre, propina_total, data["mesero"]))

            cursor.execute("UPDATE pedidos SET estado = 'cerrado' WHERE id = ?", (data["pedido_id"],))
            conn.commit()

            logger.info(f"[CIERRE] ✅ Mesa {data['mesa']} cerrada | Total: ${total:.2f} | Propina: ${propina_total:.2f}")
            return jsonify({"ok": True, "fecha_cierre": fecha_cierre})

    except Exception:
        logger.exception("[CIERRE] ❌ Error cerrando cuenta")
        return jsonify({"ok": False, "error": "Error interno"}), 500

# ------------------------------------------------------------------
# 📊 Resumen del día
# ------------------------------------------------------------------
@ventas.route("/ventas-dia", methods=["GET"])
def resumen_diario():
    if not requiere_admin_o_gerente():
        return jsonify({"error": "No autorizado"}), 403

    try:
        with get_db_connection() as conn:
            conn.row_factory = lambda cur, row: {col[0]: row[idx] for idx, col in enumerate(cur.description)}
            cursor = conn.cursor()

            resumen = cursor.execute("""
                SELECT COUNT(*) AS total_ventas,
                       COALESCE(SUM(total), 0) AS monto_total,
                       COALESCE(SUM(propina_total), 0) AS total_propinas,
                       COUNT(DISTINCT mesa) AS mesas_atendidas,
                       GROUP_CONCAT(DISTINCT mesero) AS meseros
                FROM cierre_cuentas
                WHERE DATE(fecha_hora) = DATE('now')
            """).fetchone()

            por_hora = cursor.execute("""
                SELECT strftime('%H', fecha_hora) AS hora, COUNT(*) AS cantidad, SUM(total) AS monto
                FROM cierre_cuentas
                WHERE DATE(fecha_hora) = DATE('now')
                GROUP BY hora
                ORDER BY hora
            """).fetchall()

            ultimas = cursor.execute("""
                SELECT c.id, p.mesa, c.total, c.propina_total AS propina,
                       c.mesero, strftime('%H:%M', c.fecha_hora) AS hora
                FROM cierre_cuentas c
                JOIN pedidos p ON c.pedido_id = p.id
                WHERE DATE(c.fecha_hora) = DATE('now')
                ORDER BY c.fecha_hora DESC
                LIMIT 5
            """).fetchall()

            activos = cursor.execute("""
                SELECT COUNT(*) AS total_activos,
                       GROUP_CONCAT(DISTINCT mesa) AS mesas_activas
                FROM pedidos WHERE estado != 'cerrado'
            """).fetchone()

            logger.info("[RESUMEN] ✅ Resumen diario generado correctamente")
            return jsonify({
                "ok": True,
                "resumen": {
                    "total_ventas": resumen.get("total_ventas", 0),
                    "monto_total": float(resumen.get("monto_total", 0)),
                    "total_propinas": float(resumen.get("total_propinas", 0)),
                    "mesas_atendidas": resumen.get("mesas_atendidas", 0),
                    "meseros": resumen.get("meseros", "").split(",") if resumen.get("meseros") else []
                },
                "ventas_por_hora": por_hora,
                "ultimas_ventas": ultimas,
                "pedidos_activos": {
                    "total": activos.get("total_activos", 0),
                    "mesas": activos.get("mesas_activas", "").split(",") if activos.get("mesas_activas") else []
                }
            })

    except Exception:
        logger.exception("[RESUMEN] ❌ Error en resumen diario")
        return jsonify({"ok": False, "error": "Error interno"}), 500
# ------------------------------------------------------------------
# 📅 Ventas por rango
# ------------------------------------------------------------------
@ventas.route("/ventas-rango", methods=["GET"])
def ventas_por_rango():
    if not requiere_admin_o_gerente():
        return jsonify({"error": "No autorizado"}), 403

    inicio = request.args.get("inicio")
    fin = request.args.get("fin")

    if not inicio or not fin:
        logger.warning("[RANGO] Fechas no proporcionadas")
        return jsonify({"error": "Fechas requeridas"}), 400

    try:
        with get_db_connection() as conn:
            conn.row_factory = lambda cur, row: {col[0]: row[idx] for idx, col in enumerate(cur.description)}
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DATE(fecha_hora) AS fecha, COUNT(*) AS ventas,
                       SUM(total) AS monto, SUM(propina_total) AS propinas
                FROM cierre_cuentas
                WHERE DATE(fecha_hora) BETWEEN ? AND ?
                GROUP BY fecha ORDER BY fecha
            """, (inicio, fin))
            logger.info(f"[RANGO] ✅ Ventas del rango {inicio} a {fin} consultadas correctamente")
            return jsonify({"ok": True, "ventas": cursor.fetchall()})
    except Exception:
        logger.exception("[RANGO] ❌ Error en ventas por rango")
        return jsonify({"ok": False, "error": "Error interno"}), 500


# ------------------------------------------------------------------
# 📤 Exportar CSV avanzado
# ------------------------------------------------------------------
@ventas.route("/exportar-ventas-csv-avanzado", methods=["GET"])
def exportar_csv_avanzado():
    if not requiere_admin_o_gerente():
        return jsonify({"error": "No autorizado"}), 403

    inicio = request.args.get("inicio")
    fin = request.args.get("fin")
    mesero = request.args.get("mesero")

    if not inicio or not fin:
        logger.warning("[CSV-AVANZADO] Fechas faltantes")
        return jsonify({"error": "Fechas requeridas"}), 400

    try:
        with get_db_connection() as conn:
            conn.row_factory = lambda cur, row: {col[0]: row[idx] for idx, col in enumerate(cur.description)}
            cursor = conn.cursor()

            sql = """
                SELECT c.id AS id_venta, c.pedido_id, p.mesa,
                       c.total, c.propina_total, c.mesero, c.fecha_hora
                FROM cierre_cuentas c
                JOIN pedidos p ON c.pedido_id = p.id
                WHERE DATE(c.fecha_hora) BETWEEN ? AND ?
            """
            params = [inicio, fin]

            if mesero:
                sql += " AND c.mesero = ?"
                params.append(mesero)

            sql += " ORDER BY c.fecha_hora DESC"
            cursor.execute(sql, tuple(params))
            rows = cursor.fetchall()

            headers = ["ID Venta", "ID Pedido", "Mesa", "Total", "Propina", "Mesero", "Fecha Hora"]

            def generar_csv():
                yield '\ufeff'  # BOM para Excel
                yield ",".join(headers) + "\n"
                for row in rows:
                    yield ",".join(str(row.get(h.lower().replace(" ", "_"), "")) for h in headers) + "\n"

            filename = f"ventas_{inicio}_a_{fin}.csv"
            logger.info(f"[CSV-AVANZADO] ✅ Exportación realizada para {filename}")
            return Response(
                generar_csv(),
                mimetype="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}; charset=utf-8"}
            )

    except Exception:
        logger.exception("[CSV-AVANZADO] ❌ Error exportando CSV avanzado")
        return jsonify({"ok": False, "error": "Error interno"}), 500


# ------------------------------------------------------------------
# 📤 Exportar ventas del día (rápido)
# ------------------------------------------------------------------
@ventas.route("/exportar-ventas-csv", methods=["GET"])
def exportar_csv_hoy():
    if not requiere_admin_o_gerente():
        return jsonify({"error": "No autorizado"}), 403

    try:
        fecha_hoy = datetime.date.today().isoformat()
        with get_db_connection() as conn:
            conn.row_factory = lambda cur, row: {col[0]: row[idx] for idx, col in enumerate(cur.description)}
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
                yield '\ufeff'
                yield ",".join(headers) + "\n"
                for row in rows:
                    yield ",".join(str(row.get(h.lower().replace(" ", "_"), "")) for h in headers) + "\n"

            filename = f"ventas_{fecha_hoy}.csv"
            logger.info(f"[CSV-HOY] ✅ Exportación realizada: {filename}")
            return Response(
                generar_csv(),
                mimetype="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}; charset=utf-8"}
            )
    except Exception:
        logger.exception("[CSV-HOY] ❌ Error exportando CSV hoy")
        return jsonify({"ok": False, "error": "Error interno"}), 500
