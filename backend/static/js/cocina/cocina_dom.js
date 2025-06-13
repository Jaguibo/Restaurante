import { marcarPedidoComo } from './cocina_api.js';
import { cargarYMostrarPedidos } from './cocina_eventos.js';

let pedidosAnteriores = [];
const sonidoAlerta = new Audio("/static/assets/alerta.mp3"); // 🛠 Ruta corregida

/**
 * 🧾 Muestra los pedidos pendientes en pantalla
 * @param {Array} pedidos
 */
export function mostrarPedidos(pedidos) {
  const contenedor = document.getElementById("listaPedidos");
  contenedor.innerHTML = "";

  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    mostrarMensaje("📭 No hay pedidos activos en este momento.");
    pedidosAnteriores = [];
    return;
  }

  // 🔃 Ordenar por antigüedad
  pedidos.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  // 🔔 Detectar nuevos pedidos
  const nuevosPedidos = detectarNuevosPedidos(pedidos, pedidosAnteriores);
  pedidosAnteriores = pedidos;
  if (nuevosPedidos) reproducirSonidoAlerta();

  // 📂 Agrupar por tipo de pedido
  const grupos = agruparPorTipo(pedidos);
  for (const tipo in grupos) {
    const header = document.createElement("h2");
    header.className = "text-lg font-semibold mt-6 mb-2 text-gray-700";
    header.textContent = `📂 Tipo: ${tipo.toUpperCase()}`;
    contenedor.appendChild(header);

    grupos[tipo].forEach(pedido => {
      contenedor.appendChild(renderizarPedido(pedido));
    });
  }

  asignarEventosBotones();
  console.log(`✅ [CocinaDOM] Mostrados ${pedidos.length} pedido(s)`);
}

/**
 * ℹ️ Muestra un mensaje de estado o información
 * @param {string} mensaje
 */
export function mostrarMensaje(mensaje) {
  const contenedor = document.getElementById("listaPedidos");
  contenedor.innerHTML = `
    <div class="text-center text-gray-600 bg-white p-4 rounded shadow">
      ${mensaje}
    </div>`;
}

/**
 * 🔔 Reproduce sonido de alerta
 */
function reproducirSonidoAlerta() {
  sonidoAlerta.play().catch(err => {
    console.warn("🔇 No se pudo reproducir el sonido:", err);
  });
}

/**
 * 🧠 Detecta si hay pedidos nuevos en la lista
 * @param {Array} actuales
 * @param {Array} anteriores
 * @returns {boolean}
 */
function detectarNuevosPedidos(actuales, anteriores) {
  const anterioresIds = new Set(anteriores.map(p => p.id));
  return actuales.some(p => !anterioresIds.has(p.id));
}

/**
 * 📂 Agrupa pedidos por tipo (salón, delivery, etc.)
 * @param {Array} pedidos
 * @returns {Object}
 */
function agruparPorTipo(pedidos) {
  return pedidos.reduce((grupos, pedido) => {
    const tipo = pedido.tipo || "otro";
    if (!grupos[tipo]) grupos[tipo] = [];
    grupos[tipo].push(pedido);
    return grupos;
  }, {});
}

/**
 * 🎨 Renderiza un pedido individual en el DOM
 * @param {Object} pedido
 * @returns {HTMLElement}
 */
function renderizarPedido(pedido) {
  const div = document.createElement("div");
  const fondo = "bg-white";
  const tiempoId = `tiempo-${pedido.id}`;

  let items = [];
  try {
    items = Array.isArray(pedido.items) ? pedido.items : JSON.parse(pedido.items);
  } catch (e) {
    console.error(`❌ Error interpretando items del pedido ${pedido.id}:`, e);
    div.innerHTML = `<p class="text-red-600">❌ Error al cargar productos</p>`;
    return div;
  }

  div.className = `${fondo} p-4 rounded shadow border mb-4`;

  div.innerHTML = `
    <input type="checkbox" class="check-pedido mr-2" data-id="${pedido.id}" />
    <h3 class="text-xl font-bold mb-2 inline">🪑 Mesa: ${pedido.mesa}</h3>
    <p class="mb-2 text-gray-700">
      ⏱️ Tiempo: <strong id="${tiempoId}">cargando...</strong>
    </p>
    <ul class="list-disc ml-6 text-sm text-gray-800 mb-3">
      ${items.map(i =>
        `<li>${i.cantidad} × ${i.producto}${i.nombre ? ` (para ${i.nombre})` : ""}</li>`
      ).join("")}
    </ul>
    <div class="flex gap-2">
      <button class="btn-accion bg-green-500 text-white px-3 py-1 rounded" data-id="${pedido.id}" data-accion="listo">
        ✅ Comida lista
      </button>
      <button class="btn-accion bg-blue-500 text-white px-3 py-1 rounded" data-id="${pedido.id}" data-accion="entregado">
        📦 Entregado
      </button>
      <button class="btn-accion bg-red-500 text-white px-3 py-1 rounded" data-id="${pedido.id}" data-accion="cancelado">
        ❌ Cancelar
      </button>
    </div>
  `;

  iniciarCronometro(tiempoId, pedido.fecha_hora);
  return div;
}

/**
 * 🕒 Actualiza el contenido de un span con el tiempo transcurrido
 * @param {string} spanId - ID del span a actualizar
 * @param {string} fechaInicio - fecha ISO
 */
function iniciarCronometro(spanId, fechaInicio) {
  function actualizar() {
    const el = document.getElementById(spanId);
    if (!el) return;

    const { minutos, segundos } = calcularTiempoPasado(fechaInicio);
    el.textContent = `${minutos} min ${segundos.toString().padStart(2, '0')} s`;

    el.className =
      minutos >= 15 ? "text-red-600" :
      minutos >= 10 ? "text-yellow-600" : "text-green-600";
  }

  actualizar();
  // TODO: considerar guardar y limpiar interval si se vuelve dinámico
  setInterval(actualizar, 1000);
}

/**
 * ⏱️ Calcula tiempo transcurrido desde una fecha
 * @param {string} fechaISO
 * @returns {Object} { minutos, segundos }
 */
function calcularTiempoPasado(fechaISO) {
  const inicio = new Date(fechaISO);
  const ahora = new Date();
  const diff = Math.max(0, ahora - inicio); // 🔥 Arreglo: evita negativos

  return {
    minutos: Math.floor(diff / 60000),
    segundos: Math.floor((diff % 60000) / 1000)
  };
}

/**
 * 🎯 Asigna eventos a los botones de acción (listo, entregado, cancelado)
 */
function asignarEventosBotones() {
  document.querySelectorAll(".btn-accion").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.id);
      if (isNaN(id)) return alert("❌ ID de pedido no válido.");
      const accion = btn.dataset.accion;
      const confirmar = confirm(`¿Marcar el pedido ${id} como "${accion}"?`);
      if (!confirmar) return;

      btn.disabled = true;
      const exito = await marcarPedidoComo(id, accion);
      btn.disabled = false;

      if (exito) {
        cargarYMostrarPedidos();
      } else {
        alert("❌ No se pudo actualizar el pedido.");
      }
    });
  });
}