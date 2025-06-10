// promo_dom.js
import { eliminarPromocion } from './promo_api.js';
import { cargarYMostrarPromociones } from './promo_eventos.js';

export function renderizarPromociones(lista, contenedor) {
  contenedor.innerHTML = '';
  lista.forEach(promo => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${promo.nombre}</td>
      <td>${promo.descripcion}</td>
      <td>${promo.descuento}%</td>
      <td>${promo.fecha_inicio}</td>
      <td>${promo.fecha_fin}</td>
      <td>
        <button class="btn btn-danger btn-sm" data-id="${promo.id}">
          Eliminar
        </button>
      </td>`;
    contenedor.appendChild(row);
  });

  contenedor.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const confirmacion = confirm('¿Eliminar esta promoción?');
      if (confirmacion && await eliminarPromocion(id)) {
        cargarYMostrarPromociones();
      }
    });
  });
}
