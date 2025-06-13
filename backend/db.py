import os
import sqlite3
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def get_db_connection():
    # Usa la ruta absoluta al nivel del proyecto, no solo el script actual
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_path = os.path.join(base_dir, "pedidos.db")
    logger.info(f"📍 Usando base de datos en: {db_path}")
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        logger.error("❌ No se pudo conectar a la base de datos: %s", e)
        raise RuntimeError("No se pudo conectar a la base de datos") from e

def setup_database():
    ruta_sql = os.path.join(os.path.dirname(__file__), "modelos.sql")
    if not os.path.exists(ruta_sql):
        logger.error("❌ Archivo modelos.sql no encontrado en %s", ruta_sql)
        raise FileNotFoundError(f"No se encontró modelos.sql en {ruta_sql}")

    conn = None
    try:
        conn = get_db_connection()
        with open(ruta_sql, "r", encoding="utf-8") as f:
            sql_script = f.read()
            conn.executescript(sql_script)
            conn.commit()
            logger.info("✅ Base de datos inicializada correctamente")
    except Exception as e:
        logger.exception("❌ Error al inicializar la base de datos")
        raise RuntimeError("Error al inicializar la base de datos") from e
    finally:
        if conn:
            conn.close()