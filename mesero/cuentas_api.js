// cuentas_api.js

export async function obtenerCuentasAbiertas() {
  try {
    const res = await fetch("http://localhost:5000/api/cuentas-abiertas", {
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("❌ Error al obtener cuentas abiertas:", err);
    return null;
  }
}

export async function obtenerDetalleCuenta(id) {
  try {
    const res = await fetch(`http://localhost:5000/api/detalle-cuenta/${id}`, {
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("❌ Error al obtener detalle de cuenta:", err);
    return null;
  }
}

export async function cerrarCuenta(cuenta_id, propina) {
  try {
    const res = await fetch("http://localhost:5000/api/cerrar-cuenta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ cuenta_id, propina }),
    });

    if (!res.ok) throw new Error("Error al cerrar cuenta");
    return await res.json();
  } catch (err) {
    console.error("❌ Error al cerrar cuenta:", err);
    return null;
  }
}
