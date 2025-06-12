import { productosMenu } from './menu_datos.js';

/**
 * Renderiza los productos en el contenedor HTML.
 * @param {Array} productos - Lista de productos a mostrar
 */
export function mostrarProductos(productos) {
  const contenedor = document.getElementById("menuProductos");

  if (!contenedor) {
    console.error("❌ [DOM] No se encontró el contenedor del menú (#menuProductos)");
    return;
  }

  contenedor.innerHTML = "";

  if (!Array.isArray(productos) || productos.length === 0) {
    mostrarMensajeError("😔 No hay productos disponibles en este momento.");
    return;
  }

  productos.forEach(p => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow";

    card.innerHTML = `
      <div class="mb-3">
        <h3 class="text-lg font-bold text-gray-800">${p.nombre}</h3>
        <p class="text-2xl font-bold text-green-600">$${p.precio.toFixed(2)}</p>
      </div>
      <div class="flex gap-2">
        <button 
          class="flex-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600" 
          onclick="agregarAlCarrito('${p.nombre}', ${p.precio})"
          aria-label="Agregar ${p.nombre} al carrito">
          🛒 Agregar
        </button>
        <button 
          class="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
          onclick="verDetalles('${p.nombre}', ${p.precio})"
          aria-label="Ver detalles de ${p.nombre}">
          👁️ Ver
        </button>
      </div>
    `;

    contenedor.appendChild(card);
  });

  console.log(`✅ [DOM] ${productos.length} producto(s) renderizado(s) en el menú.`);
}

/**
 * Muestra un mensaje de error visual en el contenedor de productos
 * @param {string} mensaje - Mensaje a mostrar
 */
export function mostrarMensajeError(mensaje) {
  const contenedor = document.getElementById("menuProductos");

  if (!contenedor) {
    console.warn("⚠️ [DOM] Contenedor de menú no disponible para mostrar mensaje de error.");
    return;
  }

  contenedor.innerHTML = `
    <div class="col-span-full text-center py-8">
      <p class="text-red-500 text-lg">${mensaje}</p>
      <button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        🔄 Intentar de Nuevo
      </button>
    </div>`;
}

/**
 * Muestra una notificación flotante (tipo toast)
 * @param {string} mensaje - Texto a mostrar en la notificación
 * @param {string} tipo - Tipo de notificación: "success" | "error" | "info"
 */
export function mostrarNotificacion(mensaje, tipo = "success") {
  const colorMap = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500"
  };

  const notificacion = document.createElement("div");
  notificacion.className = `fixed top-4 right-4 ${colorMap[tipo] || "bg-gray-700"} text-white px-4 py-2 rounded shadow-lg z-50`;
  notificacion.setAttribute("role", "alert");
  notificacion.textContent = mensaje;

  document.body.appendChild(notificacion);

  setTimeout(() => {
    notificacion.remove();
  }, 3000);
}
