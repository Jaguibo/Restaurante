import sqlite3
import os
import logging

# Configura el log
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 📦 Función para obtener conexión a la base de datos
def get_db_connection():
    try:
        conn = sqlite3.connect("pedidos.db")
        conn.row_factory = sqlite3.Row  # Acceso a columnas por nombre
        return conn
    except sqlite3.Error as e:
        logger.error("❌ No se pudo conectar a la base de datos: %s", e)
        raise RuntimeError("No se pudo conectar a la base de datos") from e

# 🛠️ Inicializa la base de datos ejecutando modelos.sql
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
