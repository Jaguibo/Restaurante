// menu_carrito.js
import { mostrarNotificacion } from './menu_dom.js';

export let carrito = [];

export function agregarAlCarrito(nombre, precio) {
  const existente = carrito.find(p => p.nombre === nombre);
  if (existente) {
    existente.cantidad += 1;
    console.log(`➕ Cantidad aumentada de "${nombre}"`);
  } else {
    carrito.push({ nombre, precio, cantidad: 1 });
    console.log(`🛒 "${nombre}" agregado al carrito`);
  }
  actualizarContadorCarrito();
  mostrarNotificacion(`✅ "${nombre}" agregado al carrito`);
}

export function verDetalles(nombre, precio) {
  alert(`🍽️ Producto: ${nombre}\n💰 Precio: $${precio.toFixed(2)}\n\n¡Disponible para ordenar!`);
}

export function mostrarCarrito() {
  if (carrito.length === 0) {
    alert("🛒 Tu carrito está vacío");
    return;
  }

  let resumen = "🛒 Tu Carrito:\n\n";
  let total = 0;
  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    resumen += `• ${item.nombre} - ${item.cantidad} x $${item.precio.toFixed(2)} = $${subtotal.toFixed(2)}\n`;
    total += subtotal;
  });
  resumen += `\n💰 TOTAL: $${total.toFixed(2)}`;
  alert(resumen);
}

export function vaciarCarrito() {
  if (carrito.length === 0) {
    alert("🛒 El carrito ya está vacío");
    return;
  }
  if (confirm("🗑️ ¿Seguro que quieres vaciar el carrito?")) {
    carrito = [];
    actualizarContadorCarrito();
    console.log("🗑️ Carrito vaciado");
    mostrarNotificacion("🗑️ Carrito vaciado");
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
