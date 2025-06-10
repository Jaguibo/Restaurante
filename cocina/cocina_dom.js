// cocina_dom.js
import { marcarPedidoListo } from './cocina_api.js';
import { cargarYMostrarPedidos } from './cocina_eventos.js';

let pedidosAnteriores = [];
const sonidoAlerta = new Audio("alerta.mp3");

export function mostrarPedidos(pedidos) {
  const contenedor = document.getElementById("listaPedidos");
  contenedor.innerHTML = "";

  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    return mostrarMensaje("📭 No hay pedidos activos en este momento.");
  }

  const nuevos = pedidos.length > pedidosAnteriores.length;
  pedidosAnteriores = pedidos;

  if (nuevos) {
    console.log("🔔 Nuevos pedidos detectados.");
    sonidoAlerta.play().catch(err => console.warn("🔇 Error de audio:", err));
  }

  pedidos.forEach(pedido => {
    const div = document.createElement("div");

    const minutos = calcularMinutos(pedido.fecha_hora);
    const fondo = minutos >= 15 ? "bg-red-100" : minutos >= 10 ? "bg-yellow-100" : "bg-white";

    let items = [];
    try {
      items = Array.isArray(pedido.items) ? pedido.items : JSON.parse(pedido.items);
    } catch (e) {
      console.error(`❌ Error interpretando items del pedido ${pedido.id}:`, e);
    }

    div.className = `${fondo} p-4 rounded shadow border`;
    div.innerHTML = `
      <h2 class="text-xl font-bold mb-2">🪑 Mesa: ${pedido.mesa}</h2>
      <p class="mb-2">⏱️ Tiempo transcurrido: <strong>${minutos} min</strong></p>
      <ul class="list-disc ml-6 mb-3">
        ${items.map(i =>
          `<li>${i.cantidad} × ${i.producto}${i.nombre ? ` (para ${i.nombre})` : ""}</li>`
        ).join("")}
      </ul>
      <button class="btn-listo bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" data-id="${pedido.id}">
        ✅ Comida lista
      </button>
    `;
    contenedor.appendChild(div);
  });

  // 🟢 Asignar eventos a botones
  contenedor.querySelectorAll(".btn-listo").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.id);
      console.log(`📝 Pedido ${id} marcado como listo...`);
      const exito = await marcarPedidoListo(id);
      if (exito) {
        cargarYMostrarPedidos();
      } else {
        alert("❌ No se pudo actualizar el pedido.");
      }
    });
  });

  console.log(`✅ ${pedidos.length} pedido(s) mostrados.`);
}

export function mostrarMensaje(mensaje) {
  const contenedor = document.getElementById("listaPedidos");
  contenedor.innerHTML = `
    <div class="text-center text-gray-600 bg-white p-4 rounded shadow">
      ${mensaje}
    </div>`;
}

function calcularMinutos(fechaISO) {
  const inicio = new Date(fechaISO);
  const ahora = new Date();
  return Math.floor((ahora - inicio) / 60000);
}
