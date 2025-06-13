import { obtenerPedidosPendientes } from './cocina_api.js';
import { mostrarPedidos, mostrarMensaje } from './cocina_dom.js';

let cargando = false;
let intervaloAuto = null;
let autoActualizar = true; // 🆕 Puedes usarlo con un botón "Pausar actualizaciones"

/**
 * 🔄 Carga los pedidos y los muestra, con reintentos si falla
 * @param {number} reintento - Reintento actual (interno)
 */
export async function cargarYMostrarPedidos(reintento = 0) {
  if (cargando || !autoActualizar) return; // Evita llamadas múltiples simultáneas o si está en pausa
  cargando = true;

  if (reintento === 0) {
    mostrarMensaje("🔄 Cargando pedidos...");
  }

  console.log(`📦 [Cocina] Intentando cargar pedidos... intento ${reintento + 1}`);

  const pedidos = await obtenerPedidosPendientes();

  if (pedidos === null) {
    console.warn(`⚠️ [Cocina] Falló intento ${reintento + 1}`);
    if (reintento < 2) {
      setTimeout(() => cargarYMostrarPedidos(reintento + 1), 2000);
    } else {
      mostrarMensaje("❌ No se pudieron cargar los pedidos. Intenta nuevamente.");
    }
    cargando = false;
    return;
  }

  mostrarPedidos(pedidos);
  cargando = false;
}

/**
 * 🚀 Inicializa la pantalla de cocina al cargar el DOM
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Página de cocina inicializada.");

  // Carga inicial
  cargarYMostrarPedidos();

  // 🔁 Carga automática cada minuto
  intervaloAuto = setInterval(() => {
    console.log("⏰ Actualización automática de pedidos");
    cargarYMostrarPedidos();
  }, 60000);

  // 🛑 Limpia el intervalo al salir
  window.addEventListener("beforeunload", () => {
    clearInterval(intervaloAuto);
  });

  // ✅ Acción múltiple: marcar seleccionados como listos
  const btnMulti = document.getElementById("btnMultiplesListos");
  if (btnMulti) {
    btnMulti.addEventListener("click", async () => {
      const seleccionados = [...document.querySelectorAll(".check-pedido:checked")];
      if (seleccionados.length === 0) {
        alert("⚠️ Selecciona al menos un pedido.");
        return;
      }

      const ids = seleccionados.map(c => c.dataset.id);
      const confirmacion = confirm(`¿Marcar ${ids.length} pedidos como listos?`);
      if (!confirmacion) return;

      const { marcarMultiplesPedidosListos } = await import('./cocina_api.js');
      const exitosos = await marcarMultiplesPedidosListos(ids);
      alert(`✅ ${exitosos} pedidos marcados como listos.`);
      cargarYMostrarPedidos();
    });
  }
});