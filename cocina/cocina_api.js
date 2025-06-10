// cocina_api.js

/**
 * 📦 Carga pedidos pendientes desde el backend.
 * @returns {Promise<Array>} lista de pedidos o null si falla
 */
export async function obtenerPedidosPendientes() {
  try {
    const res = await fetch("http://localhost:5000/api/pedidos-pendientes", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return await res.json();
  } catch (error) {
    console.warn("⚠️ Error al obtener pedidos:", error.message);
    return null;
  }
}

/**
 * ✅ Marca un pedido como listo (comida preparada)
 * @param {number} id 
 * @returns {boolean} true si se marcó correctamente
 */
export async function marcarPedidoListo(id) {
  try {
    const res = await fetch(`http://localhost:5000/api/pedido-listo/${id}`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return true;
  } catch (error) {
    console.error(`❌ Error al marcar pedido ${id} como listo:`, error);
    return false;
  }
}
