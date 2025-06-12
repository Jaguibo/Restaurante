import logging
import os
from flask import send_from_directory, redirect
from backend import create_app

# === Asegurar carpeta de logs en la raíz ===
LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "app.log")
os.makedirs(LOG_DIR, exist_ok=True)

# === Configurar logging global (archivo y consola) ===
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8', mode='a'),
        logging.StreamHandler()  # También imprime a consola
    ]
)
logging.info("⚙️ Creando aplicación Flask...")

app = create_app()
app._static_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "static"))
app.template_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "templates"))
logging.info("✅ Aplicación Flask creada.")

# Healthcheck route (opcional)
@app.route("/health")
def health():
    return "OK", 200

# Rutas de frontend
@app.route("/")
def index():
    return redirect("/login.html")

@app.route("/<path:filename>")
def serve_html(filename):
    templates_dir = app.template_folder
    file_path = os.path.join(templates_dir, filename)
    if os.path.exists(file_path) and filename.endswith(".html"):
        return send_from_directory(templates_dir, filename)
    static_dir = app._static_folder
    static_path = os.path.join(static_dir, filename)
    if os.path.exists(static_path):
        return send_from_directory(static_dir, filename)
    return "Archivo no encontrado", 404

# Mostrar errores detallados en los logs
app.config["PROPAGATE_EXCEPTIONS"] = True

if __name__ == "__main__":
    # Solo en local, debug y puerto 5000
    logging.info("🚀 Servidor Flask corriendo en modo debug en http://localhost:5000")
    try:
        app.run(debug=True, host="localhost", port=5000)
    except Exception as e:
        logging.critical("❌ Error crítico al iniciar el servidor Flask: %s", e, exc_info=True)
        exit(1)