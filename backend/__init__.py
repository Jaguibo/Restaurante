import logging
import bcrypt
from flask import Flask
from flask_cors import CORS
import os

IS_RENDER = os.environ.get("RENDER", "false").lower() == "true"
IS_LOCAL = not IS_RENDER  # Para usar en condiciones

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

logger = logging.getLogger(__name__)

# 👤 Crear usuario admin por defecto si no existe
def insertar_admin_si_no_existe():
    try:
        with get_db_connection() as conn:
            existe = conn.execute("SELECT 1 FROM usuarios WHERE usuario = 'admin'").fetchone()
            if not existe:
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
        app.secret_key = "supersecretkey"  # ⚠️ En producción usa una variable de entorno segura

        # 🍪 Configuración de sesión segura (adaptativa)
        app.config["SESSION_COOKIE_NAME"] = "santobocado_session"
        app.config["SESSION_COOKIE_HTTPONLY"] = True

        if IS_RENDER:
            # Producción (Render): requiere cookies seguras
            app.config["SESSION_COOKIE_SAMESITE"] = "None"
            app.config["SESSION_COOKIE_SECURE"] = True
        else:
            # Localhost: no requiere HTTPS
            app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
            app.config["SESSION_COOKIE_SECURE"] = False

        # 🌍 CORS con soporte para cookies
        CORS(app, supports_credentials=True, origins=[
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "https://restaurante-mqgs.onrender.com"
        ])

        # 🛠️ Inicializar base de datos y usuario admin
        setup_database()
        insertar_admin_si_no_existe()

        # 🧩 Registrar Blueprints
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
