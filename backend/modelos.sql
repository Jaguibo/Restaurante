-- 👤 Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('admin', 'mesero', 'cocinero'))
);

-- 🍔 Productos
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  precio REAL NOT NULL CHECK(precio >= 0),
  categoria TEXT DEFAULT 'otros'
);

-- 🧾 Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mesa TEXT NOT NULL,
  cuenta TEXT NOT NULL CHECK(cuenta IN ('junta', 'separada')),
  mesero TEXT NOT NULL,
  fecha TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'listo', 'recibido', 'cerrado')),
  tipo TEXT DEFAULT 'salon' -- 👈 Campo para tipo de pedido
);

-- 📋 Ítems de pedido
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL,
  nombre TEXT,
  producto TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK(cantidad > 0),
  precio REAL CHECK(precio >= 0),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 🧑‍🍳 Pedidos listos
CREATE TABLE IF NOT EXISTS pedidos_listos (
  pedido_id INTEGER PRIMARY KEY,
  hora_listo TEXT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 📥 Pedidos recibidos
CREATE TABLE IF NOT EXISTS pedidos_recibidos (
  pedido_id INTEGER PRIMARY KEY,
  hora_recibido TEXT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 💰 Cierre de cuentas
CREATE TABLE IF NOT EXISTS cierre_cuentas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL,
  mesa TEXT NOT NULL,
  mesero TEXT NOT NULL,
  total REAL NOT NULL CHECK(total >= 0),
  fecha_hora TEXT NOT NULL,
  propina_total REAL DEFAULT 0 CHECK(propina_total >= 0),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 📑 Cierre por cliente
CREATE TABLE IF NOT EXISTS detalle_cierre (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL,
  cliente TEXT,
  subtotal REAL CHECK(subtotal >= 0),
  propina REAL CHECK(propina >= 0),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- ⏱️ Métricas
CREATE TABLE IF NOT EXISTS pedido_metricas (
  pedido_id INTEGER PRIMARY KEY,
  tiempo_preparacion INTEGER,
  tiempo_entrega INTEGER,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 🔔 Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_hora TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 🎁 Promociones
CREATE TABLE IF NOT EXISTS promociones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  descuento INTEGER NOT NULL,
  fecha_inicio TEXT NOT NULL,
  fecha_fin TEXT NOT NULL
);

-- 👥 Usuarios iniciales
INSERT OR IGNORE INTO usuarios (usuario, password, rol) VALUES
  ('admin', '03ac674216f3e15c761ee1a5e255f067953623c8f966cb3ceefbdbf0e0c5e5a4', 'admin'),
  ('mesero1', '03ac674216f3e15c761ee1a5e255f067953623c8f966cb3ceefbdbf0e0c5e5a4', 'mesero'),
  ('cocina1', '03ac674216f3e15c761ee1a5e255f067953623c8f966cb3ceefbdbf0e0c5e5a4', 'cocinero');

-- 🍟 Productos iniciales
INSERT OR IGNORE INTO productos (nombre, precio, categoria) VALUES
  ('hamburguesa', 4.50, 'comida'),
  ('soda', 1.50, 'bebida'),
  ('salchipapas', 3.00, 'comida'),
  ('postre', 2.00, 'postre');

CREATE TABLE IF NOT EXISTS mesas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);
-- 🪑 Mesas iniciales
INSERT OR IGNORE INTO mesas (nombre) VALUES
  ('1'),
  ('2'),
  ('3'),
  ('4'),
  ('5');
