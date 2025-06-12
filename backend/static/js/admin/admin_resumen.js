document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "/api";

  const ventasTotalesEl = document.getElementById("ventasTotales");
  const totalPropinasEl = document.getElementById("totalPropinas");
  const mesasTotalesEl = document.getElementById("mesasTotales");
  const activosEl = document.getElementById("activos");
  const tabla = document.getElementById("tablaVentas");

  const formatoDinero = valor => `$${parseFloat(valor || 0).toFixed(2)}`;

  async function cargarResumenDelDia() {
    try {
      const res = await fetch(`${BASE_URL}/ventas-dia`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Fallo en la respuesta del servidor");
      const data = await res.json();

      const resumen = data.resumen || {};
      const ventas = Array.isArray(data.ultimas_ventas) ? data.ultimas_ventas : [];
      const pedidosActivos = data.pedidos_activos?.total ?? 0;

      if (ventasTotalesEl) ventasTotalesEl.textContent = formatoDinero(resumen.monto_total);
      if (totalPropinasEl) totalPropinasEl.textContent = formatoDinero(resumen.total_propinas);
      if (mesasTotalesEl) mesasTotalesEl.textContent = resumen.mesas_atendidas ?? "-";
      if (activosEl) activosEl.textContent = pedidosActivos;

      if (tabla) {
        tabla.innerHTML = "";

        if (ventas.length === 0) {
          tabla.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">No hay ventas registradas hoy.</td></tr>`;
          return;
        }

        ventas.forEach(v => {
          const fila = document.createElement("tr");
          fila.className = "border-t";
          fila.innerHTML = `
            <td class="p-2">${v.mesa}</td>
            <td class="p-2">${formatoDinero(v.total)}</td>
            <td class="p-2">${formatoDinero(v.propina)}</td>
            <td class="p-2">${v.hora}</td>
          `;
          tabla.appendChild(fila);
        });
      }

    } catch (error) {
      console.warn("❌ Error al cargar resumen del día:", error);
      alert("❌ No se pudo cargar el resumen del día.");
    }
  }

  cargarResumenDelDia();
});
