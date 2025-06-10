// pedidos_api.js

export async function verificarSesionMesero() {
  const res = await fetch("/api/verificar", { credentials: "include" });
  const data = await res.json();
  if (!data.ok || data.rol !== "mesero") throw new Error("No autorizado");
  return data.usuario;
}

export async function obtenerMesas() {
  const res = await fetch("/api/mesas", { credentials: "include" });
  return await res.json();
}

export async function enviarPedido(payload) {
  const res = await fetch("/api/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al enviar pedido");
}

export async function obtenerPedidosListos() {
  const res = await fetch("/api/pedidos-listos", { credentials: "include" });
  return await res.json();
}

export async function marcarPedidoRecibido(id) {
  const res = await fetch(`/api/pedido-recibido/${id}`, {
    method: "POST",
    credentials: "include",
  });
  return res.ok;
}
