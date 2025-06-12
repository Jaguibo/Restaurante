import sqlite3
import bcrypt

conn = sqlite3.connect("pedidos.db")
cursor = conn.cursor()

usuarios = [
    ("admin", "admin", "admin"),
    ("mesero1", "1234", "mesero"),
    ("cocina1", "1234", "cocinero")
]

for usuario, password_plano, rol in usuarios:
    password_hash = bcrypt.hashpw(password_plano.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cursor.execute("""
        UPDATE usuarios SET password = ?, rol = ? WHERE usuario = ?
    """, (password_hash, rol, usuario))

conn.commit()
conn.close()
print("✅ Contraseñas actualizadas con bcrypt correctamente.")
