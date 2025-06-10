// menu_dom.js
import { productosMenu } from './menu_datos.js';

export function mostrarProductos(productos) {
  const contenedor = document.getElementById("menuProductos");
  if (!contenedor) {
    console.error("❌ No se encontró el contenedor del menú");
    return;
  }

  contenedor.innerHTML = "";

  if (!productos || productos.length === 0) {
    contenedor.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500 text-lg">😔 No hay productos disponibles en este momento.</p>
        <button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          🔄 Recargar Menú
        </button>
      </div>`;
    return;
  }

  productos.forEach(p => {
    contenedor.innerHTML += `
      <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        <div class="mb-3">
          <h3 class="text-lg font-bold text-gray-800">${p.nombre}</h3>
          <p class="text-2xl font-bold text-green-600">$${p.precio.toFixed(2)}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="agregarAlCarrito('${p.nombre}', ${p.precio})" class="flex-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600">
            🛒 Agregar
          </button>
          <button onclick="verDetalles('${p.nombre}', ${p.precio})" class="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600">
            👁️ Ver
          </button>
        </div>
      </div>`;
  });
}

export function mostrarMensajeError(mensaje) {
  const contenedor = document.getElementById("menuProductos");
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-red-500 text-lg">❌ ${mensaje}</p>
        <button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          🔄 Intentar de Nuevo
        </button>
      </div>`;
  }
}

export function mostrarNotificacion(mensaje) {
  const notificacion = document.createElement("div");
  notificacion.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50";
  notificacion.textContent = mensaje;
  document.body.appendChild(notificacion);

  setTimeout(() => {
    notificacion.remove();
  }, 3000);
}
