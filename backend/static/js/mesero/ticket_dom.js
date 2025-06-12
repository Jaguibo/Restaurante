/**
 * 🧾 Genera y muestra un ticket imprimible
 * @param {object} pedido - Objeto con mesa, cuenta, items, mesero, fecha
 * @param {object} cierre - Objeto con propina_total, detalle[]
 */
export function generarTicket(pedido, cierre) {
  const contenedor = document.getElementById("ticketImpresion") || crearContenedor();

  const fecha = new Date().toLocaleString();
  const encabezado = `
    <div class="text-center mb-4">
      <h2 class="text-lg font-bold">🍽️ Restaurante</h2>
      <p>Mesa: <strong>${pedido.mesa}</strong></p>
      <p>Mesero: ${pedido.mesero}</p>
      <p>Fecha: ${fecha}</p>
      <hr class="my-2" />
    </div>
  `;

  const cuerpo = cierre.detalle.map(d => {
    const items = d.productos
      ? d.productos
          .map(p => `<li>${p.cantidad} × ${p.nombre} - $${(p.precio * p.cantidad).toFixed(2)}</li>`)
          .join("")
      : "";

    return `
      <div class="mb-3">
        <p><strong>${pedido.cuenta === "separada" ? d.nombre : "Cuenta total"}</strong></p>
        <ul class="ml-4 text-sm">${items}</ul>
        <p>Subtotal: $${d.subtotal.toFixed(2)}</p>
        <p>Propina: $${d.propina.toFixed(2)}</p>
        <hr class="my-2" />
      </div>
    `;
  }).join("");

  const total = cierre.detalle.reduce((s, c) => s + c.subtotal, 0);
  const propina = cierre.propina_total || 0;

  const pie = `
    <div class="text-right font-bold">
      <p>Total: $${total.toFixed(2)}</p>
      <p>Propina total: $${propina.toFixed(2)}</p>
      <p>Total a pagar: $${(total + propina).toFixed(2)}</p>
    </div>
    <div class="mt-4 text-center text-xs text-gray-600">
      ¡Gracias por su visita!
    </div>
    <div class="mt-4 text-center">
      <button onclick="window.print()" class="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">🖨️ Imprimir</button>
    </div>
  `;

  contenedor.innerHTML = encabezado + cuerpo + pie;
  contenedor.className = "bg-white p-6 rounded shadow max-w-md mx-auto mt-6 print:block";
  window.scrollTo({ top: contenedor.offsetTop, behavior: "smooth" });
}

function crearContenedor() {
  const div = document.createElement("div");
  div.id = "ticketImpresion";
  document.body.appendChild(div);
  return div;
}
