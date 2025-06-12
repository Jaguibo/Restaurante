const BASE_URL = "/api"; // 👈 Mejor usar ruta relativa para compatibilidad producción/dev

/**
 * 📦 Obtiene los pedidos pendientes desde el backend.
 * @returns {Promise<Array>} Lista de pedidos o [] si falla
 */
export async function obtenerPedidosPendientes() {
  try {
    const res = await fetch(`${BASE_URL}/pedidos-pendientes`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      console.warn(`⚠️ [CocinaAPI] Error HTTP ${res.status} al obtener pedidos pendientes`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("❌ [CocinaAPI] La respuesta no es una lista válida");
      return [];
    }

    console.log(`✅ [CocinaAPI] ${data.length} pedido(s) pendiente(s) recibido(s).`);
    return data;
  } catch (error) {
    console.error("❌ [CocinaAPI] Error de conexión al obtener pedidos pendientes:", error);
    return [];
  }
}

/**
 * ✅ Marca un pedido como 'listo' (o estado específico)
 * @param {number|string} id ID del pedido
 * @param {string} estado Estado a aplicar (por defecto: 'listo')
 * @returns {Promise<boolean>}
 */
export async function marcarPedidoComo(id, estado = "listo") {
  try {
    const res = await fetch(`${BASE_URL}/pedido-${estado}/${id}`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      console.warn(`⚠️ [CocinaAPI] Error al marcar como '${estado}' el pedido ${id}. Código: ${res.status}`);
      return false;
    }

    console.log(`✅ [CocinaAPI] Pedido ${id} marcado como '${estado}'`);
    return true;
  } catch (error) {
    console.error(`❌ [CocinaAPI] Error al cambiar estado del pedido ${id}:`, error);
    return false;
  }
}

/**
 * ⏳ Marca varios pedidos como listos (batch)
 * @param {Array<number|string>} ids Lista de IDs
 * @returns {Promise<number>} Cantidad exitosa
 */
export async function marcarMultiplesPedidosListos(ids = []) {
  let exitosos = 0;
  for (const id of ids) {
    const ok = await marcarPedidoComo(id, "listo");
    if (ok) exitosos++;
  }
  return exitosos;
}