const API_BASE = "/api/promociones";

/**
 * Obtiene todas o ciertas promociones con filtros opcionales.
 * @param {Object} filtro - Filtros opcionales (tipo, categoria, productoId, etc.)
 * @returns {Promise<Array>}
 */
export async function obtenerPromociones(filtro = {}) {
  try {
    const query = new URLSearchParams(filtro).toString();
    const res = await fetch(`${API_BASE}?${query}`, { credentials: "include" });

    if (!res.ok) {
      console.warn(`[PromocionesAPI] Error HTTP ${res.status} al obtener promociones.`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("[PromocionesAPI] Respuesta no válida al obtener promociones.");
      return [];
    }

    console.log(`✅ [PromocionesAPI] ${data.length} promoción(es) obtenida(s).`);
    return data;
  } catch (err) {
    console.error("❌ [PromocionesAPI] Error de conexión al obtener promociones:", err);
    return [];
  }
}

/**
 * Crea o actualiza una promoción.
 * Si incluye 'id', se hace PUT (edición), si no, POST (nueva).
 * @param {Object} promo - Objeto de la promoción.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function guardarPromocion(promo) {
  const isUpdate = !!promo.id;
  const url = isUpdate ? `${API_BASE}/${promo.id}` : API_BASE;
  const method = isUpdate ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(promo)
    });

    if (!res.ok) {
      const msg = await obtenerMensajeError(res);
      console.warn(`[PromocionesAPI] Error al ${isUpdate ? "actualizar" : "guardar"} promoción: ${msg}`);
      return { ok: false, error: msg };
    }

    console.log(`✅ [PromocionesAPI] Promoción ${isUpdate ? "actualizada" : "guardada"} correctamente.`);
    return { ok: true };
  } catch (err) {
    console.error(`❌ [PromocionesAPI] Error de conexión al ${isUpdate ? "actualizar" : "guardar"} promoción:`, err);
    return { ok: false, error: "Error de conexión con el servidor." };
  }
}

/**
 * Elimina una promoción por su ID.
 * @param {number|string} id - ID de la promoción.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function eliminarPromocion(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) {
      const msg = await obtenerMensajeError(res);
      console.warn(`[PromocionesAPI] Error al eliminar promoción: ${msg}`);
      return { ok: false, error: msg };
    }

    console.log(`✅ [PromocionesAPI] Promoción ${id} eliminada correctamente.`);
    return { ok: true };
  } catch (err) {
    console.error("❌ [PromocionesAPI] Error de conexión al eliminar promoción:", err);
    return { ok: false, error: "Error de conexión con el servidor." };
  }
}

/**
 * Obtiene mensaje de error legible desde la respuesta.
 * @param {Response} res
 * @returns {Promise<string>}
 */
async function obtenerMensajeError(res) {
  try {
    const data = await res.json();
    return data?.error || `Código ${res.status}`;
  } catch {
    return `Código ${res.status}`;
  }
}
