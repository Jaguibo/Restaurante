import logging
import os
import sqlite3
import hashlib
from backend import create_app  # Asegúrate de tener __init__.py en /backend

# 📁 Crear carpeta de logs si no existe
if not os.path.exists("logs"):
    os.makedirs("logs")

# 📝 Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    filename='logs/app.log',
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)

# 🚀 Crear instancia de la app Flask
app = create_app()


# 🧱 Crear tabla principal de pedidos
def init_db():
    try:
        with sqlite3.connect("pedidos.db") as conn:
            c = conn.cursor()
            c.execute('''
                CREATE TABLE IF NOT EXISTS pedidos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mesa TEXT NOT NULL,
                    cuenta TEXT CHECK(cuenta IN ('junta', 'separada')) NOT NULL,
                    mesero TEXT NOT NULL,
                    fecha TEXT NOT NULL,
                    estado TEXT CHECK(estado IN ('pendiente', 'listo', 'recibido', 'cerrado')) DEFAULT 'pendiente'
                )
            ''')
            conn.commit()
            logger.info("✅ Tabla 'pedidos' creada correctamente")
    except Exception as e:
        logger.exception("❌ Error al crear tabla 'pedidos'")
        raise


# 📦 Crear tablas adicionales (productos, usuarios, items, etc.)
def crear_tablas_extra():
    try:
        with sqlite3.connect("pedidos.db") as conn:
            c = conn.cursor()

            # Productos
            c.execute('''
                CREATE TABLE IF NOT EXISTS productos (
                    nombre TEXT PRIMARY KEY,
                    precio REAL NOT NULL
                )
            ''')
            c.executemany("INSERT OR IGNORE INTO productos (nombre, precio) VALUES (?, ?)", [
                ("hamburguesa", 4.50),
                ("soda", 1.50),
                ("salchipapas", 3.00),
                ("postre", 2.00)
            ])

            # Usuarios
            c.execute('''
                CREATE TABLE IF NOT EXISTS usuarios (
                    usuario TEXT PRIMARY KEY,
                    password_hash TEXT NOT NULL,
                    rol TEXT CHECK(rol IN ('admin', 'mesero', 'cocina')) NOT NULL
                )
            ''')

            usuarios = [
                ("admin", "1234", "admin"),
                ("mesero1", "1234", "mesero"),
                ("cocina1", "1234", "cocina")
            ]

            for usuario, clave, rol in usuarios:
                hash_ = hashlib.sha256(clave.encode()).hexdigest()
                c.execute("INSERT OR IGNORE INTO usuarios (usuario, password_hash, rol) VALUES (?, ?, ?)",
                          (usuario, hash_, rol))

            # Items
            c.execute('''
                CREATE TABLE IF NOT EXISTS items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pedido_id INTEGER NOT NULL,
                    nombre TEXT,
                    producto TEXT NOT NULL,
                    cantidad INTEGER NOT NULL,
                    precio REAL,
                    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
                )
            ''')

            # Pedidos listos
            c.execute('''
                CREATE TABLE IF NOT EXISTS pedidos_listos (
                    pedido_id INTEGER PRIMARY KEY,
                    hora_listo TEXT,
                    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
                )
            ''')

            # Pedidos recibidos
            c.execute('''
                CREATE TABLE IF NOT EXISTS pedidos_recibidos (
                    pedido_id INTEGER PRIMARY KEY,
                    hora_recibido TEXT,
                    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
                )
            ''')

            # Cuentas cerradas
            c.execute('''
                CREATE TABLE IF NOT EXISTS cuentas_cerradas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pedido_id INTEGER NOT NULL,
                    mesa TEXT NOT NULL,
                    total REAL NOT NULL,
                    fecha_cierre TEXT NOT NULL,
                    propina_total REAL,
                    mesero TEXT NOT NULL,
                    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
                )
            ''')

            conn.commit()
            logger.info("✅ Tablas adicionales creadas correctamente")
    except Exception as e:
        logger.exception("❌ Error al crear tablas extra")
        raise


# 🔨 Inicializa toda la base de datos
def setup_database():
    logger.info("🛠️ Iniciando configuración de la base de datos...")
    init_db()
    crear_tablas_extra()
    logger.info("🎉 Base de datos lista para usarse.")
