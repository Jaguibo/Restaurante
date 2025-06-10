// cocina_eventos.js
import { obtenerPedidosPendientes } from './cocina_api.js';
import { mostrarPedidos, mostrarMensaje } from './cocina_dom.js';

export async function cargarYMostrarPedidos(reintento = 0) {
  console.log("🔄 Cargando pedidos... (Intento:", reintento + 1, ")");
  const pedidos = await obtenerPedidosPendientes();

  if (pedidos === null) {
    if (reintento < 2) {
      setTimeout(() => cargarYMostrarPedidos(reintento + 1), 2000);
    } else {
      mostrarMensaje("❌ No se pudieron cargar los pedidos.");
    }
    return;
  }

  mostrarPedidos(pedidos);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Página de cocina inicializada.");
  cargarYMostrarPedidos();
  setInterval(cargarYMostrarPedidos, 60000); // Actualizar cada 60s
});
