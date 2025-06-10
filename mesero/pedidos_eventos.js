import {
  verificarSesionMesero,
  obtenerMesas,
  enviarPedido,
  obtenerPedidosListos,
  marcarPedidoRecibido
} from './pedidos_api.js';

import {
  mostrarError,
  mostrarMensaje,
  mostrarExito,
  renderizarMesas,
  resetFormulario,
  agregarLineaPedido,
  obtenerItemsDelFormulario,
  renderizarPedidosListos,
  cargarMenuVisual
} from './pedidos_dom.js';

let mesero = "";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    mesero = await verificarSesionMesero();
    document.getElementById("meseroNombre").textContent = mesero;
  } catch {
    window.location.href = "/login.html";
    return;
  }

  try {
    const mesas = await obtenerMesas();
    renderizarMesas(mesas);
  } catch {
    mostrarError("❌ No se pudieron cargar las mesas.");
  }

  // ✅ Carga menú visual agrupado por categoría
  await cargarMenuVisual();

  // 🎛️ Elementos del DOM
  const tipoCuenta = document.getElementById("tipoCuenta");
  const mesaSelect = document.getElementById("mesa");
  const enviarBtn = document.getElementById("enviarCocina");

  // ⏮️ Resetear formulario cuando cambia cuenta o mesa
  tipoCuenta.addEventListener("change", resetFormulario);
  mesaSelect.addEventListener("change", resetFormulario);

  // 🚀 Enviar a cocina
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
      mostrarExito("✅ Pedido enviado correctamente.");
      resetFormulario();
    } catch {
      mostrarError("❌ Error al enviar el pedido.");
    }
  });

  // 🔄 Cargar pedidos listos
  async function cargarPedidosListos() {
    try {
      mostrarMensaje("🔄 Cargando pedidos listos...");
      const pedidos = await obtenerPedidosListos();

      if (!Array.isArray(pedidos)) throw new Error("Respuesta inválida del servidor");

      renderizarPedidosListos(pedidos, marcarComoRecibido);
    } catch (err) {
      console.error("❌ Error en cargarPedidosListos:", err);
      mostrarError("❌ Error al cargar pedidos listos.");
    }
  }

  // ✅ Marcar recibido
  async function marcarComoRecibido(id) {
    const ok = await marcarPedidoRecibido(id);
    if (ok) {
      mostrarExito("✅ Pedido marcado como recibido.");
      cargarPedidosListos();
    } else {
      mostrarError("❌ No se pudo marcar como recibido.");
    }
  }

  cargarPedidosListos();
  setInterval(cargarPedidosListos, 60000); // Recarga cada 60s
});
