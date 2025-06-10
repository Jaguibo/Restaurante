document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:5000/api";

  const ventasTotalesEl = document.getElementById("ventasTotales");
  const totalPropinasEl = document.getElementById("totalPropinas");
  const mesasTotalesEl = document.getElementById("mesasTotales");
  const activosEl = document.getElementById("activos");
  const tabla = document.getElementById("tablaVentas");

  async function cargarResumenDelDia() {
    try {
      const res = await fetch(`${BASE_URL}/ventas-dia`, {
        method: "GET",
        credentials: "include"
      });
      const data = await res.json();
      const resumen = data.resumen || {};
      const ventas = Array.isArray(data.ultimas_ventas) ? data.ultimas_ventas : [];
      const pedidosActivos = data.pedidos_activos?.total ?? 0;

      if (ventasTotalesEl) ventasTotalesEl.textContent = `$${(resumen.monto_total || 0).toFixed(2)}`;
      if (totalPropinasEl) totalPropinasEl.textContent = `$${(resumen.total_propinas || 0).toFixed(2)}`;
      if (mesasTotalesEl) mesasTotalesEl.textContent = resumen.mesas_atendidas ?? "-";
      if (activosEl) activosEl.textContent = pedidosActivos;

      if (tabla) {
        tabla.innerHTML = ventas.length
          ? ventas.map(v => `
              <tr class="border-t">
                <td class="p-2">${v.mesa}</td>
                <td class="p-2">$${v.total.toFixed(2)}</td>
                <td class="p-2">$${v.propina.toFixed(2)}</td>
                <td class="p-2">${v.hora}</td>
              </tr>
            `).join("")
          : `<tr><td colspan="4" class="text-center p-4 text-gray-500">No hay ventas registradas hoy.</td></tr>`;
      }
    } catch (error) {
      console.warn("❌ Error al cargar resumen del día:", error);
      alert("❌ Error al cargar resumen del día.");
    }
  }

  cargarResumenDelDia();
});
