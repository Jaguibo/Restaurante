// promo_api.js

export async function obtenerPromociones() {
  try {
    const res = await fetch('/api/promociones');
    if (!res.ok) throw new Error('Error al obtener promociones');
    return await res.json();
  } catch (err) {
    console.error('❌ Error cargando promociones:', err);
    return [];
  }
}

export async function guardarPromocion(promo) {
  try {
    const res = await fetch('/api/promociones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promo),
    });
    return res.ok;
  } catch (err) {
    console.error('❌ Error al guardar promoción:', err);
    return false;
  }
}

export async function eliminarPromocion(id) {
  try {
    const res = await fetch(`/api/promociones/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('❌ Error al eliminar promoción:', err);
    return false;
  }
}
