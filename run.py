import logging
import os
from flask import send_from_directory, render_template, Flask, redirect
from backend import create_app

# ⚙️ Crear aplicación Flask, configurando static y templates
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logging.info("⚙️ Creando aplicación Flask...")
app = create_app()
# Asegúrate de que Flask sepa dónde están los estáticos y templates
app._static_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "static"))
app.template_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "templates"))
logging.info("✅ Aplicación Flask creada.")

# 🌐 Rutas de frontend
@app.route("/")
def index():
    return redirect("/login.html")

@app.route("/<path:filename>")
def serve_html(filename):
    # Solo servir archivos HTML, y solo si existen en templates (seguridad)
    templates_dir = app.template_folder
    file_path = os.path.join(templates_dir, filename)
    if os.path.exists(file_path) and filename.endswith(".html"):
        return send_from_directory(templates_dir, filename)
    # Si es un archivo estático (js, css, assets, etc)
    static_dir = app._static_folder
    static_path = os.path.join(static_dir, filename)
    if os.path.exists(static_path):
        return send_from_directory(static_dir, filename)
    # No encontrado
    return "Archivo no encontrado", 404

if __name__ == "__main__":
    logging.info("🚀 Servidor Flask corriendo en modo debug en http://localhost:5000")
    try:
        app.run(debug=True, host="localhost", port=5000)
    except Exception as e:
        logging.critical("❌ Error crítico al iniciar el servidor Flask: %s", e)
        exit(1)
