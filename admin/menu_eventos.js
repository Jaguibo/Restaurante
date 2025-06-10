// menu_eventos.js
import { cargarMenu } from './menu_datos.js';
import { mostrarProductos, mostrarMensajeError } from './menu_dom.js';
import { actualizarContadorCarrito } from './menu_carrito.js';
import { configurarBuscador } from './menu_busqueda.js';

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🍽️ Inicializando sistema de menú...");

  const { productos, error } = await cargarMenu();

  if (error) {
    mostrarMensajeError(error);
  } else {
    mostrarProductos(productos);
  }

  configurarBuscador();
  actualizarContadorCarrito();
});

// 🔄 Recargar menú cada 5 minutos
setInterval(async () => {
  console.log("🔄 Recarga automática del menú...");
  const { productos, error } = await cargarMenu();
  if (!error) mostrarProductos(productos);
}, 300000);
