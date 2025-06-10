// cuentas_eventos.js
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

let cuentaSeleccionada = null;
let datosCuenta = [];

async function cargarCuentas() {
  const cuentas = await obtenerCuentasAbiertas();
  if (cuentas === null) {
    mostrarMensaje("Error al cargar cuentas abiertas.", "error");
    return;
  }

  renderizarListaCuentas(cuentas, seleccionarCuenta);
}

async function seleccionarCuenta(id) {
  const detalle = await obtenerDetalleCuenta(id);
  if (!detalle) {
    mostrarMensaje("Error al obtener detalle de la cuenta.", "error");
    return;
  }

  cuentaSeleccionada = id;
  datosCuenta = detalle;
  mostrarDetalleCuenta(detalle);
}

function configurarEventos() {
  const cerrarBtn = document.getElementById("cerrarCuentaBtn");
  const volverBtn = document.getElementById("volverBtn");

  cerrarBtn.addEventListener("click", async () => {
    if (!cuentaSeleccionada) {
      mostrarMensaje("⚠️ No hay cuenta seleccionada.", "error");
      return;
    }

    const propina = parseFloat(document.getElementById("propina").value) || 0;
    if (propina < 0) {
      mostrarMensaje("⚠️ La propina no puede ser negativa.", "error");
      return;
    }

    const confirmar = confirm("¿Estás seguro de cerrar esta cuenta?");
    if (!confirmar) return;

    const resultado = await cerrarCuenta(cuentaSeleccionada, propina);
    if (resultado) {
      mostrarMensaje("✅ Cuenta cerrada correctamente.");
      cuentaSeleccionada = null;
      volverALista();
      cargarCuentas();
    } else {
      mostrarMensaje("❌ Error al cerrar la cuenta.", "error");
    }
  });

  volverBtn.addEventListener("click", () => {
    cuentaSeleccionada = null;
    volverALista();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  cargarCuentas();
  configurarEventos();
});
