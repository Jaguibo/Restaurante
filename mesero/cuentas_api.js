// ✅ Obtener cuentas abiertas (requiere parámetro `mesero`)
export async function obtenerCuentasAbiertas() {
  const usuario = sessionStorage.getItem("usuario") || "mesero1";  // Ajusta si lo tienes en otro lado
  try {
    const res = await fetch(`http://localhost:5000/api/cuentas?mesero=${usuario}`, {
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("❌ Error al obtener cuentas abiertas:", err);
    return null;
  }
}

// ✅ Detalle de cuenta (opcional, si tienes esta ruta)
export async function obtenerDetalleCuenta(id) {
  try {
    const res = await fetch(`http://localhost:5000/api/pedido/${id}`, {
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("❌ Error al obtener detalle de cuenta:", err);
    return null;
  }
}

// ✅ Cerrar cuenta
export async function cerrarCuenta(pedido_id, propina) {
  try {
    const mesero = sessionStorage.getItem("usuario") || "mesero1";  // o como lo estés manejando
    const res = await fetch("http://localhost:5000/api/cuentas/cerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pedido_id, propina, mesero }),
    });

    if (!res.ok) throw new Error("Error al cerrar cuenta");
    return await res.json();
  } catch (err) {
    console.error("❌ Error al cerrar cuenta:", err);
    return null;
  }
}
