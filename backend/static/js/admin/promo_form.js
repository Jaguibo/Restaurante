document.addEventListener('DOMContentLoaded', () => {
  const tipoSelect = document.getElementById('tipo');
  if (tipoSelect) {
    tipoSelect.addEventListener('change', actualizarCamposPorTipo);
    actualizarCamposPorTipo(); // Inicial
  }
});

/**
 * Muestra u oculta campos del formulario según el tipo de promoción
 */
function actualizarCamposPorTipo() {
  const tipo = document.getElementById('tipo').value;

  mostrarCampo('grupo-productos', tipo === 'producto');
  mostrarCampo('grupo-categoria', tipo === 'categoria');
  mostrarCampo('grupo-combo', tipo === 'combo');
  mostrarCampo('grupo-descuento', tipo === 'descuento');

  // Campos compartidos por combos y descuentos
  mostrarCampo('grupo-porcentaje', tipo === 'descuento' || tipo === 'producto' || tipo === 'categoria');
  mostrarCampo('grupo-producto-gratis', tipo === 'combo');
  mostrarCampo('grupo-minimo', tipo === 'descuento' || tipo === 'combo');
  mostrarCampo('grupo-horario', tipo !== '');
  mostrarCampo('grupo-dias', tipo !== '');
}

/**
 * Muestra u oculta un grupo de campos del formulario
 * @param {string} id - ID del grupo
 * @param {boolean} mostrar - true = visible, false = oculto
 */
function mostrarCampo(id, mostrar) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = mostrar ? 'block' : 'none';

  // También limpia su contenido si se oculta
  if (!mostrar) {
    el.querySelectorAll('input, select').forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false;
      } else if (input.multiple) {
        Array.from(input.options).forEach(opt => opt.selected = false);
      } else {
        input.value = '';
      }
    });
  }
}
