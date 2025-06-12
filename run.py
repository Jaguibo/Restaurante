import logging
import os
from flask import send_from_directory, render_template, Flask, redirect
from backend import create_app

# 📂 Directorios base
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "backend", "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "backend", "templates")

# ⚙️ Logger configuración
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logging.info("⚙️ Creando aplicación Flask...")

# 🚀 Crear app y configurar rutas
app = create_app()
app._static_folder = STATIC_DIR
app.template_folder = TEMPLATES_DIR
logging.info("✅ Aplicación Flask creada.")

# 🏠 Redirigir raíz al login
@app.route("/")
def index():
    return redirect("/login.html")

# 🌐 Servir HTML y archivos estáticos
@app.route("/<path:filename>")
def serve_frontend(filename):
    # Archivos HTML desde templates
    html_path = os.path.join(app.template_folder, filename)
    if filename.endswith(".html") and os.path.exists(html_path):
        return send_from_directory(app.template_folder, filename)

    # Archivos estáticos desde static
    static_path = os.path.join(app._static_folder, filename)
    if os.path.exists(static_path):
        return send_from_directory(app._static_folder, filename)

    # ❌ Si no existe
    return "Archivo no encontrado", 404

# 🔁 Arranque
if __name__ == "__main__":
    logging.info("🚀 Servidor Flask corriendo en http://localhost:5000")
    try:
        app.run(debug=True, host="0.0.0.0", port=5000)
    except Exception as e:
        logging.critical("❌ Error crítico al iniciar el servidor Flask: %s", e)
        exit(1)
