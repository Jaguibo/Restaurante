// menu_carrito.js
import { mostrarNotificacion } from './menu_dom.js';

export let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

export function agregarAlCarrito(nombre, precio) {
  const item = carrito.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (item) {
    item.cantidad += 1;
    console.log(`➕ Cantidad aumentada de "${nombre}"`);
  } else {
    carrito.push({ nombre, precio, cantidad: 1 });
    console.log(`🛒 "${nombre}" agregado al carrito`);
  }
  sincronizarCarrito();
  actualizarContadorCarrito();
  mostrarNotificacion(`✅ "${nombre}" agregado al carrito`);
}

export function eliminarUnidad(nombre) {
  const item = carrito.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (item) {
    item.cantidad -= 1;
    if (item.cantidad <= 0) {
      carrito = carrito.filter(p => p.nombre.toLowerCase() !== nombre.toLowerCase());
      mostrarNotificacion(`🗑️ "${nombre}" eliminado del carrito`);
    } else {
      mostrarNotificacion(`➖ Se quitó una unidad de "${nombre}"`);
    }
    sincronizarCarrito();
    actualizarContadorCarrito();
    renderizarCarrito();
  }
}

export function vaciarCarrito() {
  if (carrito.length === 0) {
    alert("🛒 El carrito ya está vacío");
    return;
  }
  if (confirm("🗑️ ¿Vaciar todo el carrito?")) {
    carrito = [];
    sincronizarCarrito();
    actualizarContadorCarrito();
    mostrarNotificacion("🧹 Carrito vaciado");
    renderizarCarrito();
  }
}

export function actualizarContadorCarrito() {
  const contador = document.getElementById("contadorCarrito");
  const total = carrito.reduce((sum, p) => sum + p.cantidad, 0);
  if (contador) {
    contador.textContent = total;
    contador.style.display = total > 0 ? "inline" : "none";
  }
}

export function obtenerCarrito() {
  return carrito;
}

export function renderizarCarrito() {
  const contenedor = document.getElementById("carritoContenedor");
  if (!contenedor) {
    alert("⚠️ No se encontró el contenedor del carrito");
    return;
  }

  contenedor.innerHTML = "";
  if (carrito.length === 0) {
    contenedor.innerHTML = `<p class="text-gray-500 p-2">Tu carrito está vacío 🛒</p>`;
    return;
  }

  let total = 0;
  carrito.forEach((item, i) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const fila = document.createElement("div");
    fila.className = "flex justify-between items-center bg-white shadow rounded p-2 mb-2";

    fila.innerHTML = `
      <div>
        <strong>${item.nombre}</strong><br>
        ${item.cantidad} x $${item.precio.toFixed(2)} = <span class="font-bold">$${subtotal.toFixed(2)}</span>
      </div>
      <div class="space-x-1">
        <button class="px-2 py-1 bg-yellow-400 rounded" onclick="window.eliminarUnidad('${item.nombre}')">➖</button>
        <button class="px-2 py-1 bg-red-500 text-white rounded" onclick="window.eliminarProducto('${item.nombre}')">🗑️</button>
      </div>
    `;
    contenedor.appendChild(fila);
  });

  const resumen = document.createElement("div");
  resumen.className = "text-right font-bold mt-4";
  resumen.textContent = `Total: $${total.toFixed(2)}`;
  contenedor.appendChild(resumen);
}

export function mostrarCarrito() {
  const modal = document.getElementById("modalCarrito");
  if (!modal) {
    alert("❌ No se encontró el modal del carrito");
    return;
  }
  modal.style.display = "block";
  renderizarCarrito();
}

function sincronizarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

window.eliminarUnidad = eliminarUnidad;
window.eliminarProducto = (nombre) => {
  carrito = carrito.filter(p => p.nombre.toLowerCase() !== nombre.toLowerCase());
  sincronizarCarrito();
  actualizarContadorCarrito();
  mostrarNotificacion(`🗑️ "${nombre}" eliminado`);
  renderizarCarrito();
};
