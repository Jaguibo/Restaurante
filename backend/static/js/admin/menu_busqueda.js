// menu_busqueda.js
import { productosMenu } from './productos.js';
import { mostrarProductos } from './menu_dom.js';

export function configurarBuscador() {
  const campo = document.getElementById("busquedaMenu");
  if (!campo) return;

  let timer;
  campo.addEventListener("input", e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const termino = e.target.value.trim().toLowerCase();
      if (!termino) {
        mostrarProductos(productosMenu);
        return;
      }

      const filtrados = productosMenu.filter(p =>
        p.nombre.toLowerCase().includes(termino)
      );

      console.log(`🔍 Búsqueda: "${termino}" - ${filtrados.length} resultado(s)`);
      mostrarProductos(filtrados);
    }, 300);
  });
}
