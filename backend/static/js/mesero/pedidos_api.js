// pedidos_api.js

const BASE_URL = "http://localhost:5000/api"; // ✅ Reutilizable

// 🔐 Verificar sesión activa y rol de mesero
export async function verificarSesionMesero() {
  try {
    const res = await fetch(`${BASE_URL}/verificar`, {
      method: "GET",
      credentials: "include"
    });

    const data = await res.json();
    console.log("🔐 Resultado verificación mesero:", data);

    if (res.ok && data.ok && data.rol === "mesero") {
      return data.usuario;
    } else {
      throw new Error("Sesión inválida o rol incorrecto");
    }

  } catch (err) {
    console.warn("❌ Sesión no válida (verificarSesionMesero):", err);
    throw err;
  }
}

// 🪑 Obtener listado de mesas
export async function obtenerMesas() {
  const res = await fetch(`${BASE_URL}/mesas`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("❌ No se pudieron obtener las mesas");
  }

  return await res.json();
}

// 📤 Enviar nuevo pedido
export async function enviarPedido(payload) {
  const res = await fetch(`${BASE_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error("❌ Error al enviar el pedido");
  }
}

// 📬 Obtener pedidos listos para entregar
export async function obtenerPedidosListos() {
  const res = await fetch(`${BASE_URL}/pedidos-listos`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("❌ No se pudieron obtener los pedidos listos");
  }

  return await res.json();
}

// ✅ Marcar pedido como recibido por el mesero
export async function marcarPedidoRecibido(id) {
  const res = await fetch(`${BASE_URL}/pedido-recibido/${id}`, {
    method: "POST",
    credentials: "include"
  });

  return res.ok;
}
