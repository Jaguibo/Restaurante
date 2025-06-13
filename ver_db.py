import sqlite3
import os

# Usar la misma ruta que usa tu app
base_dir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(base_dir, "pedidos.db")

print(f"📍 Usando base de datos en: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Imprimir todos los usuarios
print("\n👤 Usuarios:")
try:
    cursor.execute("SELECT id, usuario, rol FROM usuarios")
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print("⚠️ No se pudo leer la tabla usuarios:", e)

# Imprimir todos los productos
print("\n🍔 Productos:")
try:
    cursor.execute("SELECT id, nombre, precio, categoria FROM productos")
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print("⚠️ No se pudo leer la tabla productos:", e)

conn.close()
