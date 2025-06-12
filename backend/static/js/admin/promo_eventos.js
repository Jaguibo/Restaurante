import { obtenerPromociones, guardarPromocion } from './promo_api.js';
import { renderizarPromociones } from './promo_dom.js';

export async function cargarYMostrarPromociones() {
  const promociones = await obtenerPromociones();
  const promoList = document.getElementById('promo-list');
  if (promoList) renderizarPromociones(promociones, promoList);
}

document.addEventListener('DOMContentLoaded', () => {
  const promoForm = document.getElementById('promo-form');

  promoForm.addEventListener('submit', async e => {
    e.preventDefault();

    const tipo = document.getElementById('tipo').value;
    const productoIds = obtenerSeleccionMultiple('productoIds'); // select[multiple]
    const comboProductos = obtenerSeleccionMultiple('comboProductos');
    const diasValidos = obtenerSeleccionMultiple('diasValidos');
    const productoGratisId = document.getElementById('productoGratisId')?.value || null;
    const categoria = document.getElementById('categoria')?.value || '';
    const porcentajeDescuento = parseInt(document.getElementById('porcentajeDescuento')?.value || 0);
    const minimoMonto = parseFloat(document.getElementById('minimoMonto')?.value || 0);
    const minimoCantidad = parseInt(document.getElementById('minimoCantidad')?.value || 0);
    const horario = document.getElementById('horario')?.value || '';

    const nuevaPromo = {
      titulo: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim(),
      tipo,
      productoIds,
      categoria,
      comboProductos,
      productoGratisId: productoGratisId || null,
      porcentajeDescuento: porcentajeDescuento || 0,
      minimoMonto,
      minimoCantidad,
      diasValidos,
      horario,
      fecha_inicio: document.getElementById('fecha_inicio').value,
      fecha_fin: document.getElementById('fecha_fin').value,
    };

    if (!nuevaPromo.titulo || !nuevaPromo.tipo || !nuevaPromo.fecha_inicio || !nuevaPromo.fecha_fin) {
      alert("⚠️ Debes completar todos los campos obligatorios.");
      return;
    }

    const resultado = await guardarPromocion(nuevaPromo);
    if (resultado.ok) {
      promoForm.reset();
      cargarYMostrarPromociones();
    } else {
      alert(`❌ Error: ${resultado.error || 'No se pudo guardar la promoción'}`);
    }
  });

  cargarYMostrarPromociones();
});

/**
 * Devuelve los valores seleccionados de un <select multiple>
 * @param {string} id - ID del select
 * @returns {Array}
 */
function obtenerSeleccionMultiple(id) {
  const select = document.getElementById(id);
  if (!select) return [];
  return Array.from(select.selectedOptions).map(opt => opt.value);
}
