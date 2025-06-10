// pedidos_eventos.js
import {
  verificarSesionMesero,
  obtenerMesas,
  enviarPedido,
  obtenerPedidosListos,
  marcarPedidoRecibido
} from './pedidos_api.js';

import {
  mostrarError,
  renderizarMesas,
  resetFormulario,
  agregarLineaPedido,
  obtenerItemsDelFormulario,
  renderizarPedidosListos
} from './pedidos_dom.js';

let mesero = "";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    mesero = await verificarSesionMesero();
    document.getElementById("meseroNombre").textContent = mesero;
  } catch {
    window.location.href = "login.html";
    return;
  }

  try {
    const mesas = await obtenerMesas();
    renderizarMesas(mesas);
  } catch {
    mostrarError("❌ No se pudieron cargar las mesas.");
  }

  const tipoCuenta = document.getElementById("tipoCuenta");
  const mesaSelect = document.getElementById("mesa");
  const agregarBtn = document.getElementById("agregarPedido");
  const enviarBtn = document.getElementById("enviarCocina");

  tipoCuenta.addEventListener("change", resetFormulario);
  mesaSelect.addEventListener("change", resetFormulario);

  agregarBtn.addEventListener("click", () => {
    agregarLineaPedido(tipoCuenta.value);
  });

  enviarBtn.addEventListener("click", async () => {
    const mesa = mesaSelect.value;
    const cuenta = tipoCuenta.value;

    if (!mesa) {
      mostrarError("⚠️ Debes seleccionar una mesa.");
      return;
    }

    const { items, incompletos } = obtenerItemsDelFormulario(cuenta);

    if (incompletos || items.length === 0) {
      mostrarError("⚠️ Completa correctamente todos los campos.");
      return;
    }

    const payload = {
      mesa,
      cuenta,
      items,
      mesero,
      fecha: new Date().toISOString().split("T")[0],
    };

    try {
      await enviarPedido(payload);
      alert("✅ Pedido enviado correctamente.");
      resetFormulario();
    } catch {
      mostrarError("❌ Error al enviar el pedido.");
    }
  });

  async function cargarPedidosListos() {
    try {
      const pedidos = await obtenerPedidosListos();
      renderizarPedidosListos(pedidos, marcarComoRecibido);
    } catch {
      mostrarError("❌ Error al cargar pedidos listos.");
    }
  }

  async function marcarComoRecibido(id) {
    const ok = await marcarPedidoRecibido(id);
    if (ok) {
      alert("✅ Pedido marcado como recibido.");
      cargarPedidosListos();
    } else {
      alert("❌ No se pudo marcar como recibido.");
    }
  }

  cargarPedidosListos();
  setInterval(cargarPedidosListos, 60000); // Recarga cada 60s
});
