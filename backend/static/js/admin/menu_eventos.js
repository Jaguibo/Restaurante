import { cargarMenu } from './menu_datos.js';
import { mostrarProductos, mostrarMensajeError, mostrarNotificacion } from './menu_dom.js';
import { actualizarContadorCarrito } from './menu_carrito.js';
import { configurarBuscador } from './menu_busqueda.js';

// Para evitar renderizados innecesarios
let productosPrevios = [];

document.addEventListener("DOMContentLoaded", () => {
  console.log("🍽️ [MenuEventos] Inicializando sistema de menú...");
  inicializarMenu();
  configurarBuscador();
  actualizarContadorCarrito();
});

/**
 * Carga y renderiza el menú una sola vez o con fallback offline
 */
async function inicializarMenu() {
  const { productos, error, offline, warning } = await cargarMenu();

  if (error) {
    mostrarMensajeError(error);
    if (offline) mostrarNotificacion("Modo offline: mostrando productos guardados", "info");
    return;
  }

  mostrarProductos(productos);
  productosPrevios = productos;
}

/**
 * Recarga periódica del menú desde el servidor
 */
setInterval(async () => {
  console.log("🔄 [MenuEventos] Recarga automática del menú...");

  const { productos, error } = await cargarMenu();

  if (error) {
    console.warn("⚠️ [MenuEventos] Falló la recarga automática del menú.");
    return;
  }

  // Evita renderizar si los productos son iguales (opcional, para eficiencia)
  const mismaCantidad = productosPrevios.length === productos.length;
  const mismoContenido = JSON.stringify(productosPrevios) === JSON.stringify(productos);

  if (mismaCantidad && mismoContenido) {
    console.log("⏸️ [MenuEventos] Menú sin cambios, no se vuelve a renderizar.");
    return;
  }

  mostrarProductos(productos);
  productosPrevios = productos;
  mostrarNotificacion("🔄 Menú actualizado automáticamente");
}, 300000); // cada 5 minutos
