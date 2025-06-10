import logging
from backend import create_app  # Ya incluye insertar_admin_si_no_existe
from backend.db import setup_database

if __name__ == "__main__":
    # 📝 Configurar logging global
    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )

    # 🔧 Inicializar base de datos (crear tablas si no existen)
    try:
        logging.info("🔧 Inicializando base de datos...")
        setup_database()
        logging.info("✅ Base de datos lista.")
    except Exception as e:
        logging.error("❌ Error al inicializar la base de datos: %s", e)
        exit(1)

    # ⚙️ Crear aplicación Flask
    try:
        logging.info("⚙️ Creando aplicación Flask...")
        app = create_app()  # Ya llama a insertar_admin_si_no_existe()
        logging.info("✅ Aplicación Flask creada.")
    except Exception as e:
        logging.error("❌ Error al crear la aplicación Flask: %s", e)
        exit(1)

    # 🚀 Ejecutar servidor Flask
    logging.info("🚀 Servidor Flask corriendo en modo debug en http://localhost:5000")
    try:
        app.run(debug=True, host="localhost", port=5000)
    except Exception as e:
        logging.critical("❌ Error crítico al iniciar el servidor Flask: %s", e)
        exit(1)
