import { eliminarPromocion } from './promo_api.js';

/**
 * Renderiza una lista de promociones en una tabla HTML
 * @param {Array} lista - Lista de promociones
 * @param {HTMLElement} contenedor - Elemento <tbody> del DOM
 */
export function renderizarPromociones(lista, contenedor) {
  contenedor.innerHTML = '';

  if (!Array.isArray(lista) || lista.length === 0) {
    contenedor.innerHTML = `<tr><td colspan="8" class="text-center text-gray-500 py-4">No hay promociones registradas</td></tr>`;
    return;
  }

  lista.forEach(promo => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${promo.titulo}</td>
      <td>${promo.tipo}</td>
      <td>${promo.descripcion || '-'}</td>
      <td>${promo.categoria || '-'}</td>
      <td>${promo.porcentajeDescuento ? promo.porcentajeDescuento + '%' : '-'}</td>
      <td>${formatearFechas(promo)}</td>
      <td>${formatearCondiciones(promo)}</td>
      <td>
        <button class="btn btn-sm text-blue-600" data-editar-id="${promo.id}">✏️</button>
        <button class="btn btn-sm text-red-600" data-id="${promo.id}">🗑️</button>
      </td>
    `;

    contenedor.appendChild(row);
  });

  // Asignar eventos a botones de eliminar
  contenedor.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('¿Eliminar esta promoción?')) {
        const resultado = await eliminarPromocion(id);
        if (resultado.ok) {
          location.reload(); // O puedes llamar cargarYMostrarPromociones() si tienes acceso aquí
        } else {
          alert(`❌ Error: ${resultado.error || 'No se pudo eliminar.'}`);
        }
      }
    });
  });

  // Asignar eventos a botones de edición (placeholder)
  contenedor.querySelectorAll('button[data-editar-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-editar-id');
      alert(`Editar promoción ID: ${id} (función aún no implementada)`);
    });
  });
}

// 🧠 Helpers

function formatearFechas(promo) {
  const inicio = promo.fecha_inicio || '';
  const fin = promo.fecha_fin || '';
  return `${inicio} → ${fin}`;
}

function formatearCondiciones(promo) {
  const dias = promo.diasValidos?.join(', ') || '';
  const horario = promo.horario || '';
  const minimo = promo.minimoMonto ? `$${promo.minimoMonto}` : '';
  const combo = promo.comboProductos?.length > 0 ? `Combo: ${promo.comboProductos.join(', ')}` : '';
  return [dias, horario, minimo, combo].filter(Boolean).join(' | ');
}
