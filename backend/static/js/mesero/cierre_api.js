import { cerrarCuenta } from './cierre_api.js';


/**
 * 💳 Abre el modal de cierre de cuenta
 * @param {number} pedidoId
 * @param {Array} usuarios - [{ nombre, productos: [...] }]
 */
export function mostrarCuenta(pedidoId, usuarios) {
  const modal = document.getElementById("modalCuenta");
  const detalle = document.getElementById("detalleCuenta");
  const propinaInput = document.getElementById("propinaTotal");

  // Dividir propina toggle
  if (!document.getElementById("propinaDividir")) {
    const toggle = document.createElement("div");
    toggle.className = "mt-2 text-sm text-gray-600 flex items-center gap-2";
    toggle.innerHTML = `
      <input type="checkbox" id="propinaDividir" class="accent-green-600" checked>
      <label for="propinaDividir">Dividir propina entre seleccionados</label>
    `;
    propinaInput.parentElement.appendChild(toggle);
  }

  detalle.innerHTML = "";
  propinaInput.value = "0";

  usuarios.forEach((u, index) => {
    const total = u.productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

    const div = document.createElement("div");
    div.className = "bg-gray-50 p-3 rounded border";

    div.innerHTML = `
      <label class="flex items-center gap-2 font-bold mb-1">
        <input type="checkbox" class="usuario-check" data-index="${index}" checked />
        ${u.nombre}
      </label>
      <ul class="list-disc pl-6 text-sm text-gray-700">
        ${u.productos.map(p => `
          <li>${p.cantidad} × ${p.nombre} - $${(p.precio * p.cantidad).toFixed(2)}</li>
        `).join("")}
      </ul>
      <p class="mt-2 font-semibold text-right">Subtotal: $${total.toFixed(2)}</p>
    `;

    detalle.appendChild(div);
  });

  modal.classList.remove("hidden");

  document.getElementById("formCierreCuenta").onsubmit = async e => {
    e.preventDefault();

    const seleccionados = [...document.querySelectorAll(".usuario-check")]
      .filter(c => c.checked)
      .map(c => parseInt(c.dataset.index));

    if (seleccionados.length === 0) {
      alert("⚠️ Selecciona al menos un usuario.");
      return;
    }

    const propinaTotal = parseInt(propinaInput.value) || 0;
    const dividir = document.getElementById("propinaDividir")?.checked;

    const payload = {
      propina_total: propinaTotal,
      detalle: seleccionados.map(i => {
        const u = usuarios[i];
        const subtotal = u.productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
        return {
          nombre: u.nombre,
          subtotal,
          productos: u.productos,
          propina_individual: dividir ? Math.floor(propinaTotal / seleccionados.length) : 0
        };
      })
    };

    const { ok, error } = await cerrarCuenta(pedidoId, payload);
    if (ok) {
      alert("✅ Cuenta cerrada con éxito.");
      modal.classList.add("hidden");
    } else {
      alert(`❌ Error al cerrar cuenta: ${error}`);
    }
  };

  document.getElementById("cancelarCuenta").onclick = () => {
    modal.classList.add("hidden");
  };
}
