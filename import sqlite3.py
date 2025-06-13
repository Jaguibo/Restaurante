import sqlite3

conn = sqlite3.connect("pedidos.db")
cursor = conn.cursor()

cursor.execute("SELECT usuario, rol FROM usuarios")
for fila in cursor.fetchall():
    print(fila)

conn.close()
