import {
  verificarSesionMesero,
  obtenerMesas,
  enviarPedido,
  obtenerPedidosListos,
  marcarPedidoRecibido
} from './pedidos_api.js';

// De pedidos_dom.js
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

// De cierre_dom.js
import { mostrarFormularioCierre } from './cierre_dom.js';


let mesero = "";
let listaPedidosSeparados = [];

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

  await cargarMenuVisual();

  const tipoCuentaSelect = document.getElementById("tipoCuenta");
  const mesaSelect = document.getElementById("mesa");
  const enviarBtn = document.getElementById("enviarCocina");
  const siguienteBtn = document.getElementById("siguienteCliente");
  const botonesSeparados = document.getElementById("botonesSeparados");

  tipoCuentaSelect.addEventListener("change", () => {
    resetFormulario();
    listaPedidosSeparados = [];
    botonesSeparados.classList.toggle("hidden", tipoCuentaSelect.value !== "separada");
  });

  mesaSelect.addEventListener("change", resetFormulario);

  siguienteBtn.addEventListener("click", () => {
    const { items, incompletos } = obtenerItemsDelFormulario("separada");

    if (incompletos || items.length === 0) {
      mostrarError("⚠️ Completa correctamente nombre y productos.");
      return;
    }

    listaPedidosSeparados.push(...items);
    resetFormulario();
  });

  enviarBtn.addEventListener("click", async () => {
    const mesa = mesaSelect.value;
    const cuenta = tipoCuentaSelect.value;

    if (!mesa) {
      mostrarError("⚠️ Debes seleccionar una mesa.");
      return;
    }

    let items = [];

    if (cuenta === "separada") {
      const { items: ultimoCliente, incompletos } = obtenerItemsDelFormulario("separada");

      if (!incompletos && ultimoCliente.length > 0) {
        listaPedidosSeparados.push(...ultimoCliente);
      }

      if (listaPedidosSeparados.length === 0) {
        mostrarError("⚠️ Debes agregar al menos un pedido.");
        return;
      }

      items = [...listaPedidosSeparados];
    } else {
      const { items: itemsJuntos, incompletos } = obtenerItemsDelFormulario("junta");

      if (incompletos || itemsJuntos.length === 0) {
        mostrarError("⚠️ Completa correctamente todos los campos.");
        return;
      }

      items = itemsJuntos;
    }

    const payload = {
      mesa,
      cuenta,
      items,
      mesero,
      fecha: new Date().toISOString()
    };

    try {
      await enviarPedido(payload);
      mostrarExito("✅ Pedido enviado correctamente.");
      resetFormulario();
      listaPedidosSeparados = [];
    } catch {
      mostrarError("❌ Error al enviar el pedido.");
    }
  });

  async function cargarPedidosListos() {
    try {
      const pedidos = await obtenerPedidosListos();
      renderizarPedidosListos(pedidos, marcarComoRecibido);
    } catch (err) {
      console.error("❌ Error en cargarPedidosListos:", err);
      mostrarError("❌ Error al cargar pedidos listos.");
    }
  }

  async function marcarComoRecibido(id, pedido) {
    const ok = await marcarPedidoRecibido(id);
    if (ok) {
      mostrarExito("✅ Pedido marcado como recibido.");
      cargarPedidosListos();
      mostrarFormularioCierre(pedido); // 👈 Muestra formulario de cierre directamente
    } else {
      mostrarError("❌ No se pudo marcar como recibido.");
    }
  }

  await cargarPedidosListos();
  setInterval(cargarPedidosListos, 60000);
});
