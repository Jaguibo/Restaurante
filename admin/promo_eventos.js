// promo_eventos.js
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

    const nuevaPromo = {
      nombre: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim(),
      descuento: parseInt(document.getElementById('descuento').value),
      fecha_inicio: document.getElementById('fecha_inicio').value,
      fecha_fin: document.getElementById('fecha_fin').value,
    };

    const ok = await guardarPromocion(nuevaPromo);
    if (ok) {
      promoForm.reset();
      cargarYMostrarPromociones();
    } else {
      alert('❌ Error al guardar la promoción');
    }
  });

  cargarYMostrarPromociones();
});
