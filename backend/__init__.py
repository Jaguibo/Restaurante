import logging
import bcrypt
from flask import Flask
from flask_cors import CORS

# 🔁 Rutas (blueprints)
from backend.routes.auth import auth
from backend.routes.pedidos import pedidos
from backend.routes.ventas import ventas
from backend.routes.cocina import cocina
from backend.routes.cuentas import cuentas
from backend.routes.admin import admin
from backend.routes.promociones import promociones_bp
from backend.routes.productos import productos_bp

from backend.db import get_db_connection, setup_database

# 📝 Configuración de logs
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# 👤 Crear usuario admin por defecto si no existe
def insertar_admin_si_no_existe():
    try:
        with get_db_connection() as conn:
            existe = conn.execute("SELECT 1 FROM usuarios WHERE usuario = 'admin'").fetchone()
            if not existe:
                # 🔐 Hashear contraseña antes de guardar
                password_plano = "admin"
                password_hash = bcrypt.hashpw(password_plano.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

                conn.execute(
                    "INSERT INTO usuarios (usuario, password, rol) VALUES (?, ?, ?)", 
                    ('admin', password_hash, 'admin')
                )
                conn.commit()
                logger.info("✅ Usuario admin creado por defecto")
            else:
                logger.info("ℹ️ Usuario admin ya existe")
    except Exception as e:
        logger.exception("❌ Error al insertar usuario admin")


# 🚀 Crear la aplicación Flask
def create_app():
    try:
        logger.info("🛠️ Iniciando aplicación Flask...")

        app = Flask(__name__)
        app.secret_key = "clave-super-segura"  # 🔐 Cambia esto en producción

        # 🍪 Configuración de cookies
        app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
        app.config["SESSION_COOKIE_SECURE"] = False  # True en producción con HTTPS

        # 🔄 Habilita CORS para frontend local
        CORS(app, supports_credentials=True, origins=[
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        ])

        # 🔧 Inicializa la base de datos y crea usuario admin
        setup_database()
        insertar_admin_si_no_existe()

        # 📦 Registrar rutas
        app.register_blueprint(auth)
        app.register_blueprint(pedidos)
        app.register_blueprint(ventas)
        app.register_blueprint(cocina)
        app.register_blueprint(cuentas)
        app.register_blueprint(admin)
        app.register_blueprint(promociones_bp)
        app.register_blueprint(productos_bp)


        logger.info("✅ Aplicación Flask creada con éxito")
        return app

    except Exception as e:
        logger.exception("❌ Error al crear la aplicación Flask")
        raise
