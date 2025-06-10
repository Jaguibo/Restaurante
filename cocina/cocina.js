let pedidosAnteriores = [];

const sonidoAlerta = new Audio("alerta.mp3"); // 🔔 Archivo de sonido (asegúrate que exista)

/**
 * 📦 Carga los pedidos con reintentos automáticos.
 */
async function cargarPedidos(reintento = 0) {
  console.log("🔄 Cargando pedidos... (Intento:", reintento + 1, ")");

  try {
    const res = await fetch("http://localhost:5000/api/pedidos-pendientes", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const pedidos = await res.json();
    actualizarListaPedidos(pedidos);

  } catch (error) {
    console.warn("⚠️ Error al cargar pedidos:", error.message);

    if (reintento < 2) {
      // 🛠️ Intentar de nuevo hasta 3 veces
      console.log("🔁 Reintentando cargar pedidos...");
      setTimeout(() => cargarPedidos(reintento + 1), 2000);
    } else {
      console.error("❌ No se pudieron cargar los pedidos tras varios intentos.");
      mostrarMensaje("❌ No se pudieron cargar los pedidos.");
    }
  }
}

/**
 * 🔁 Actualiza la interfaz con los pedidos activos.
 * @param {Array} pedidos 
 */
function actualizarListaPedidos(pedidos) {
  const contenedor = document.getElementById("listaPedidos");
  contenedor.innerHTML = "";

  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    console.log("📭 No hay pedidos pendientes.");
    return mostrarMensaje("📭 No hay pedidos activos en este momento.");
  }

  // 🔔 Verificar si hay nuevos pedidos
  const nuevos = pedidos.length > pedidosAnteriores.length;
  pedidosAnteriores = pedidos;

  if (nuevos) {
    console.log("🔔 Nuevos pedidos detectados.");
    sonidoAlerta.play().catch(err => {
      console.warn("🔇 Error al reproducir sonido:", err);
    });
  }

  pedidos.forEach(pedido => {
    const tiempoInicio = new Date(pedido.fecha_hora);
    const ahora = new Date();
    const minutos = Math.floor((ahora - tiempoInicio) / 60000);

    let items = [];
    try {
      items = Array.isArray(pedido.items) ? pedido.items : JSON.parse(pedido.items);
    } catch (e) {
      console.error(`❌ Error al interpretar items del pedido ${pedido.id}:`, e);
    }

    // 🌈 Color según tiempo transcurrido
    let fondo = "bg-white";
    if (minutos >= 15) fondo = "bg-red-100";
    else if (minutos >= 10) fondo = "bg-yellow-100";

    const div = document.createElement("div");
    div.className = `${fondo} p-4 rounded shadow border`;

    div.innerHTML = `
      <h2 class="text-xl font-bold mb-2">🪑 Mesa: ${pedido.mesa}</h2>
      <p class="mb-2">⏱️ Tiempo transcurrido: <strong>${minutos} min</strong></p>
      <ul class="list-disc ml-6 mb-3">
        ${items.map(i =>
          `<li>${i.cantidad} × ${i.producto}${i.nombre ? ` (para ${i.nombre})` : ""}</li>`
        ).join("")}
      </ul>
      <button onclick="marcarLista(${pedido.id})" 
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
        ✅ Comida lista
      </button>
    `;

    contenedor.appendChild(div);
  });

  console.log(`✅ ${pedidos.length} pedido(s) actualizados en pantalla.`);
}

/**
 * ✅ Marca un pedido como "comida lista".
 * @param {number} id 
 */
async function marcarLista(id) {
  console.log(`📝 Marcando pedido ${id} como listo...`);

  try {
    const res = await fetch(`http://localhost:5000/api/pedido-listo/${id}`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      console.warn(`⚠️ Error al marcar pedido ${id}. Código: ${res.status}`);
      alert("❌ No se pudo actualizar el estado del pedido.");
      return;
    }

    console.log(`✅ Pedido ${id} marcado como listo.`);
    cargarPedidos();

  } catch (error) {
    console.error(`❌ Error de red al actualizar pedido ${id}:`, error);
    alert("❌ Error al intentar actualizar el pedido.");
  }
}

/**
 * 💬 Muestra un mensaje dentro del contenedor.
 */
function mostrarMensaje(texto) {
  const contenedor = document.getElementById("listaPedidos");
  contenedor.innerHTML = `
    <div class="text-center text-gray-600 bg-white p-4 rounded shadow">
      ${texto}
    </div>`;
}

// 🚀 Inicio automático
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Página de cocina cargada.");
  cargarPedidos();                      // Carga inicial
  setInterval(cargarPedidos, 60000);   // 🔁 Actualización cada 60s
});
