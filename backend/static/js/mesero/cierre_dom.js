import { cerrarCuenta } from "./cierre_api.js";
import { mostrarExito, mostrarError } from "./pedidos_dom.js";
import { generarTicket } from "./ticket_dom.js"; // para imprimir ticket (opcional)

let pedidoActual = null;
let cuentaTipo = "junta"; // default

export function mostrarFormularioCierre(pedido) {
  pedidoActual = pedido;
  cuentaTipo = pedido.cuenta;

  const contenedor = document.getElementById("detalleCierre");
  contenedor.innerHTML = "";

  const clientes = agruparItemsPorCliente(pedido.items, cuentaTipo);

  // ⚙️ Selector de propina
  const selector = document.createElement("div");
  selector.className = "mb-4 flex gap-2 items-center";
  selector.innerHTML = `
    <label class="font-semibold">Aplicar propina:</label>
    <select id="selectorPropina" class="border p-1 rounded">
      <option value="0">0%</option>
      <option value="5">5%</option>
      <option value="10" selected>10%</option>
      <option value="15">15%</option>
      <option value="custom">Personalizada</option>
    </select>
  `;
  contenedor.appendChild(selector);

  // 💳 Selector forma de pago
  const metodo = document.createElement("div");
  metodo.className = "mb-4";
  metodo.innerHTML = `
    <label class="block font-semibold mb-1">Forma de pago:</label>
    <select id="formaPago" class="border p-2 rounded w-full">
      <option value="efectivo">Efectivo</option>
      <option value="tarjeta">Tarjeta</option>
      <option value="mixto">Mixto</option>
    </select>
  `;
  contenedor.appendChild(metodo);

  // 🎯 Bloques por cliente
  clientes.forEach((datos, nombre) => {
    const propinaSugerida = (datos.subtotal * 0.10).toFixed(2);
    const div = document.createElement("div");
    div.className = "bg-white border rounded p-4 mb-3 shadow";

    div.innerHTML = `
      <h3 class="font-semibold mb-2">${cuentaTipo === "separada" ? `👤 ${nombre}` : "💵 Cuenta total"}</h3>
      <ul class="text-sm mb-2">
        ${datos.productos.map(p =>
          `<li>${p.cantidad} × ${p.producto} = $${(p.precio * p.cantidad).toFixed(2)}</li>`
        ).join("")}
      </ul>
      <p>Subtotal: <strong>$${datos.subtotal.toFixed(2)}</strong></p>
      <label class="block mt-2 text-sm">Propina:</label>
      <input type="number" class="input-propina border p-1 mt-1 rounded w-full"
        data-cliente="${nombre}" 
        value="${propinaSugerida}" 
        min="0" step="0.01" />
    `;

    contenedor.appendChild(div);
  });

  // 🔘 Botones
  const acciones = document.createElement("div");
  acciones.className = "flex flex-wrap gap-4 mt-4";

  acciones.innerHTML = `
    <button id="btnSinPropina" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
      ❌ Cerrar sin propina
    </button>
    <button id="btnConfirmar" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
      ✅ Confirmar cierre
    </button>
    <button id="btnImprimir" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hidden">
      🧾 Imprimir ticket
    </button>
  `;

  contenedor.appendChild(acciones);

  // 🎯 Eventos
  document.getElementById("selectorPropina").addEventListener("change", aplicarPropinaGlobal);
  document.getElementById("btnConfirmar").addEventListener("click", confirmarConPropina);
  document.getElementById("btnSinPropina").addEventListener("click", cerrarSinPropina);
  document.getElementById("btnImprimir").addEventListener("click", () => {
    if (generarTicket) generarTicket(pedidoActual); 
    else window.print();
  });
}

function agruparItemsPorCliente(items, cuenta) {
  const clientes = new Map();
  items.forEach(i => {
    const nombre = cuenta === "separada" ? (i.nombre || "Sin nombre") : "Total";
    if (!clientes.has(nombre)) {
      clientes.set(nombre, { subtotal: 0, productos: [] });
    }
    clientes.get(nombre).subtotal += i.precio * i.cantidad;
    clientes.get(nombre).productos.push(i);
  });
  return clientes;
}

function aplicarPropinaGlobal(e) {
  const porcentaje = e.target.value;
  const inputs = document.querySelectorAll(".input-propina");

  inputs.forEach(input => {
    const subtotalText = input.closest("div").querySelector("p").textContent;
    const subtotal = parseFloat(subtotalText.match(/\$([\d.]+)/)?.[1]) || 0;

    if (porcentaje === "custom") return;
    const propina = subtotal * (parseFloat(porcentaje) / 100);
    input.value = propina.toFixed(2);
  });
}

async function confirmarConPropina() {
  const inputs = document.querySelectorAll(".input-propina");
  const detalle = [];
  let totalPropina = 0;

  inputs.forEach(input => {
    const cliente = input.dataset.cliente;
    const propina = parseFloat(input.value) || 0;
    const subtotal = parseFloat(input.closest("div").querySelector("p").textContent.match(/\$([\d.]+)/)?.[1]) || 0;

    detalle.push({ nombre: cliente, subtotal, propina });
    totalPropina += propina;
  });

  const forma_pago = document.getElementById("formaPago").value;
  await enviarCierre(pedidoActual.id, detalle, totalPropina, forma_pago);
}

async function cerrarSinPropina() {
  const inputs = document.querySelectorAll(".input-propina");
  const detalle = [];

  inputs.forEach(input => {
    const cliente = input.dataset.cliente;
    const subtotal = parseFloat(input.closest("div").querySelector("p").textContent.match(/\$([\d.]+)/)?.[1]) || 0;

    detalle.push({ nombre: cliente, subtotal, propina: 0 });
  });

  const forma_pago = document.getElementById("formaPago").value;
  await enviarCierre(pedidoActual.id, detalle, 0, forma_pago);
}

async function enviarCierre(pedidoId, detalle, propinaTotal, forma_pago) {
  try {
    const { ok, error } = await cerrarCuenta(pedidoId, {
      propina_total: propinaTotal,
      detalle,
      forma_pago
    });

    if (ok) {
      mostrarExito("✅ Cuenta cerrada correctamente");
      document.getElementById("detalleCierre").innerHTML = "";
      document.getElementById("btnImprimir").classList.remove("hidden");
      generarTicket?.(pedidoActual, { propina_total: propinaTotal, detalle, forma_pago });
    } else {
      mostrarError("❌ Error al cerrar cuenta: " + (error || "Desconocido"));
    }
  } catch (e) {
    console.error("❌ Excepción en cierre de cuenta:", e);
    mostrarError("❌ Falló la comunicación con el servidor");
  }
}
