import { obtenerPromociones, guardarPromocion, eliminarPromocion } from './promo_api.js';
import { renderizarPromociones } from './promo_dom.js';

/**
 * Carga las promociones desde el servidor y las renderiza en la tabla
 */
export async function cargarYMostrarPromociones() {
  const promociones = await obtenerPromociones();
  const contenedor = document.getElementById('promo-list');
  if (contenedor) {
    renderizarPromociones(promociones, contenedor);
  }
}

/**
 * Intenta guardar una promoción (crear o actualizar) y recargar la lista
 * @param {Object} datos - Objeto con la promoción a guardar
 * @returns {Promise<boolean>} - true si se guardó correctamente
 */
export async function guardarYRecargarPromocion(datos) {
  const resultado = await guardarPromocion(datos);
  if (resultado.ok) {
    await cargarYMostrarPromociones();
    return true;
  } else {
    alert(`❌ Error: ${resultado.error || 'No se pudo guardar la promoción'}`);
    return false;
  }
}

/**
 * Elimina una promoción y recarga la lista
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function eliminarYRecargarPromocion(id) {
  const resultado = await eliminarPromocion(id);
  if (resultado.ok) {
    await cargarYMostrarPromociones();
  } else {
    alert(`❌ Error: ${resultado.error || 'No se pudo eliminar.'}`);
  }
}
