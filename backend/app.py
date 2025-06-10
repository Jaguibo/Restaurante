from flask import Flask
from flask_cors import CORS
from backend.routes import auth, admin, cocina, cuentas, pedidos, promociones, ventas
from rutas.productos import productos_bp

def create_app():
    app = Flask(__name__)
    app.secret_key = "supersecretkey"
    app.config["SESSION_COOKIE_NAME"] = "santobocado_session"
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # o 'None' si usas HTTPS
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SECURE"] = False    # True si usas HTTPS

    CORS(app, supports_credentials=True)

    # Registro de Blueprints
    app.register_blueprint(auth.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(cocina.bp)
    app.register_blueprint(cuentas.bp)
    app.register_blueprint(pedidos.bp)
    app.register_blueprint(promociones.bp)
    app.register_blueprint(ventas.bp)
    app.register_blueprint(productos_bp)

    return app
