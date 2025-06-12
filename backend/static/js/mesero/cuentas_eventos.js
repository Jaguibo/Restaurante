import {
  obtenerCuentasAbiertas,
  obtenerDetalleCuenta,
  cerrarCuenta
} from './cuentas_api.js';

import {
  renderizarListaCuentas,
  mostrarDetalleCuenta,
  mostrarMensaje,
  volverALista
} from './cuentas_dom.js';

import { generarTicket } from './ticket_dom.js'; // si usas impresión

let cuentaSeleccionada = null;
let datosCuenta = [];

async function cargarCuentas() {
  const cuentas = await obtenerCuentasAbiertas();
  if (cuentas === null) {
    mostrarMensaje("❌ Error al cargar cuentas abiertas.", "error");
    return;
  }

  renderizarListaCuentas(cuentas, seleccionarCuenta);
}

async function seleccionarCuenta(id) {
  const detalle = await obtenerDetalleCuenta(id);
  if (!detalle) {
    mostrarMensaje("❌ Error al obtener detalle de la cuenta.", "error");
    return;
  }

  cuentaSeleccionada = id;
  datosCuenta = detalle;
  mostrarDetalleCuenta(detalle);
  sugerirPropinaDesdeSelector(); // aplica automáticamente
}

function configurarEventos() {
  const cerrarBtn = document.getElementById("cerrarCuentaBtn");
  const cerrarSinBtn = document.getElementById("cerrarSinPropinaBtn");
  const volverBtn = document.getElementById("volverBtn");
  const propinaSelect = document.getElementById("propinaSelector");

  cerrarBtn.addEventListener("click", async () => {
    if (!cuentaSeleccionada) return mostrarMensaje("⚠️ Selecciona una cuenta.", "error");

    const propina = parseFloat(document.getElementById("propina").value) || 0;
    if (propina < 0) return mostrarMensaje("⚠️ La propina no puede ser negativa.", "error");

    if (!confirm("¿Cerrar esta cuenta con propina?")) return;

    const resultado = await cerrarCuenta(cuentaSeleccionada, propina);
    if (resultado) {
      mostrarMensaje("✅ Cuenta cerrada correctamente.");
      generarTicket?.(
        { id: cuentaSeleccionada, mesa: datosCuenta[0]?.mesa || "-", mesero: sessionStorage.getItem("usuario") || "mesero" },
        {
          propina_total: propina,
          detalle: [{
            nombre: "Cliente",
            subtotal: calcularSubtotal(datosCuenta),
            propina,
            productos: datosCuenta
          }]
        }
      );

      cuentaSeleccionada = null;
      volverALista();
      cargarCuentas();
    } else {
      mostrarMensaje("❌ Error al cerrar la cuenta.", "error");
    }
  });

  cerrarSinBtn?.addEventListener("click", async () => {
    if (!cuentaSeleccionada) return mostrarMensaje("⚠️ Selecciona una cuenta.", "error");

    if (!confirm("¿Cerrar esta cuenta sin propina?")) return;

    const resultado = await cerrarCuenta(cuentaSeleccionada, 0);
    if (resultado) {
      mostrarMensaje("✅ Cuenta cerrada sin propina.");
      generarTicket?.(
        { id: cuentaSeleccionada, mesa: datosCuenta[0]?.mesa || "-", mesero: sessionStorage.getItem("usuario") || "mesero" },
        {
          propina_total: 0,
          detalle: [{
            nombre: "Cliente",
            subtotal: calcularSubtotal(datosCuenta),
            propina: 0,
            productos: datosCuenta
          }]
        }
      );

      cuentaSeleccionada = null;
      volverALista();
      cargarCuentas();
    } else {
      mostrarMensaje("❌ Error al cerrar sin propina.", "error");
    }
  });

  volverBtn.addEventListener("click", () => {
    cuentaSeleccionada = null;
    volverALista();
  });

  propinaSelect?.addEventListener("change", sugerirPropinaDesdeSelector);
}

function sugerirPropinaDesdeSelector() {
  const select = document.getElementById("propinaSelector");
  const propinaInput = document.getElementById("propina");

  if (!select || !propinaInput || !datosCuenta.length) return;

  const porcentaje = parseFloat(select.value);
  const subtotal = calcularSubtotal(datosCuenta);

  if (isNaN(porcentaje)) return;

  const propinaCalculada = subtotal * (porcentaje / 100);
  const redondeo = Math.ceil(subtotal + propinaCalculada); // ej: $9760 → $10000
  const sugerida = redondeo - subtotal;

  propinaInput.value = sugerida.toFixed(2);
}

function calcularSubtotal(productos) {
  return productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
}

document.addEventListener("DOMContentLoaded", () => {
  cargarCuentas();
  configurarEventos();
});
