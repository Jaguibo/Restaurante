-- 👤 Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- 🔐 Guarda el hash (recomiendo bcrypt)
  rol TEXT NOT NULL CHECK(rol IN ('admin', 'mesero', 'cocinero'))
);

-- 🍔 Tabla de productos del menú
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  precio REAL NOT NULL CHECK(precio >= 0),
  categoria TEXT DEFAULT 'otros'
);

-- 🧾 Tabla de pedidos (una por mesa en cada sesión)
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mesa TEXT NOT NULL,
  cuenta TEXT NOT NULL CHECK(cuenta IN ('junta', 'separada')),
  mesero TEXT NOT NULL,
  fecha TEXT NOT NULL, -- 📅 Formato ISO
  estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'listo', 'recibido', 'cerrado'))
);

-- 📋 Detalles de ítems de cada pedido
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL,
  nombre TEXT, -- Si cuenta es separada, guarda cliente
  producto TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK(cantidad > 0),
  precio REAL CHECK(precio >= 0), -- Precio unitario
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 🧑‍🍳 Registro de pedidos listos
CREATE TABLE IF NOT EXISTS pedidos_listos (
  pedido_id INTEGER PRIMARY KEY,
  hora_listo TEXT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 📥 Pedidos que el mesero ya recibió
CREATE TABLE IF NOT EXISTS pedidos_recibidos (
  pedido_id INTEGER PRIMARY KEY,
  hora_recibido TEXT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 💰 Cierre de cuenta total
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

-- 📑 Detalle de cierre por cliente (sólo para cuentas separadas)
CREATE TABLE IF NOT EXISTS detalle_cierre (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL,
  cliente TEXT,
  subtotal REAL CHECK(subtotal >= 0),
  propina REAL CHECK(propina >= 0),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- ⏱️ Métricas por pedido (preparación, entrega, recepción)
CREATE TABLE IF NOT EXISTS pedido_metricas (
  pedido_id INTEGER PRIMARY KEY,
  tiempo_preparacion INTEGER, -- En segundos
  tiempo_entrega INTEGER,     -- En segundos (desde listo hasta recibido)
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 🔔 Historial de notificaciones (opcional)
CREATE TABLE IF NOT EXISTS notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,          -- Ej: 'pedido_listo', 'nuevo_pedido'
  mensaje TEXT NOT NULL,
  fecha_hora TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promociones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    descuento INTEGER NOT NULL,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT NOT NULL
);

