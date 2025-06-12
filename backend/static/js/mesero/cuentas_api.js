const API_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:5000/api"
  : "https://restaurante-mqgs.onrender.com/api";

const USUARIO = sessionStorage.getItem("usuario") || "mesero1";


/**
 * 📂 Obtiene las cuentas abiertas del mesero
 */
export async function obtenerCuentasAbiertas() {
  try {
    const res = await fetch(`${API_BASE}/cuentas?mesero=${USUARIO}`, {
      credentials: "include",
    });

    if (!res.ok) {
      console.warn(`[MeseroAPI] ⚠️ Error HTTP ${res.status} al obtener cuentas abiertas`);
      return null;
    }

    const data = await res.json();
    console.log(`✅ [MeseroAPI] ${data.length} cuenta(s) abierta(s) cargada(s)`);
    return data;
  } catch (err) {
    console.error("❌ [MeseroAPI] Error de conexión al obtener cuentas abiertas:", err);
    return null;
  }
}

/**
 * 📋 Obtiene detalle de un pedido
 */
export async function obtenerDetalleCuenta(id) {
  try {
    const res = await fetch(`${API_BASE}/pedido/${id}`, {
      credentials: "include",
    });

    if (!res.ok) {
      console.warn(`[MeseroAPI] ⚠️ Error HTTP ${res.status} al obtener detalle del pedido ${id}`);
      return null;
    }

    const data = await res.json();
    console.log(`✅ [MeseroAPI] Detalle de pedido ${id} obtenido`);
    return data;
  } catch (err) {
    console.error(`❌ [MeseroAPI] Error de conexión al obtener detalle de pedido ${id}:`, err);
    return null;
  }
}

/**
 * 💳 Cierra una cuenta (con o sin desglose por cliente)
 * @param {number} pedido_id
 * @param {object} datos - { propina_total, detalle?: [{ nombre, subtotal, propina }] }
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function cerrarCuenta(pedido_id, datos) {
  const body = {
    pedido_id,
    mesero: USUARIO,
    ...datos
  };

  // ✅ Validar si hay desglose (detalle[])
  if (body.detalle && Array.isArray(body.detalle)) {
    const sumaDetalle = body.detalle.reduce((sum, c) => sum + (parseFloat(c.propina) || 0), 0);
    const total = parseFloat(body.propina_total || 0);

    if (Math.abs(sumaDetalle - total) > 0.01) {
      const error = `⚠️ La suma de propinas individuales ($${sumaDetalle.toFixed(2)}) no coincide con el total ($${total.toFixed(2)})`;
      console.warn(`[MeseroAPI] ${error}`);
      return { ok: false, error };
    }
  }

  try {
    const res = await fetch(`${API_BASE}/cuentas/cerrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const msg = await obtenerMensajeError(res);
      console.warn(`[MeseroAPI] ❌ Error al cerrar cuenta: ${msg}`);
      return { ok: false, error: msg };
    }

    console.log(`✅ [MeseroAPI] Cuenta ${pedido_id} cerrada (${body.detalle ? "con desglose" : "total"})`);
    return { ok: true };
  } catch (err) {
    console.error(`❌ [MeseroAPI] Error al cerrar cuenta ${pedido_id}:`, err);
    return { ok: false, error: "Error de conexión con el servidor" };
  }
}

/**
 * 📤 Extrae mensaje de error del backend (si existe)
 */
async function obtenerMensajeError(res) {
  try {
    const data = await res.json();
    return data?.error || `Código ${res.status}`;
  } catch {
    return `Código ${res.status}`;
  }
}
