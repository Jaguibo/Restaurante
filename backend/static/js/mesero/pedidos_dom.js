const SONIDO = new Audio("assets/notificacion.mp3");
let contador = 0;
let pedidosAnteriores = [];

// 🟥 Mostrar error
export function mostrarError(texto) {
  const div = document.getElementById("error");
  if (!div) return;
  div.textContent = `❌ ${texto}`;
  div.className = "bg-red-100 text-red-700 border border-red-300 p-2 rounded mb-4 text-sm text-center";
  div.classList.remove("hidden");
  setTimeout(() => div.classList.add("hidden"), 4000);
}

// 🟩 Mostrar éxito
export function mostrarExito(texto) {
  const div = document.getElementById("mensaje");
  if (!div) return;
  div.textContent = `✅ ${texto}`;
  div.className = "bg-green-100 text-green-700 border border-green-300 p-2 rounded mb-4 text-sm text-center";
  div.classList.remove("hidden");
  setTimeout(() => div.classList.add("hidden"), 3000);
}

// 🟦 Mostrar info
export function mostrarMensaje(texto) {
  const div = document.getElementById("mensaje");
  if (!div) return;
  div.textContent = `🔄 ${texto}`;
  div.className = "bg-blue-100 text-blue-700 border border-blue-300 p-2 rounded mb-4 text-sm text-center";
  div.classList.remove("hidden");
  setTimeout(() => div.classList.add("hidden"), 3000);
}

// 🪑 Mesas
export function renderizarMesas(mesas) {
  const mesaSelect = document.getElementById("mesa");
  mesaSelect.innerHTML = '<option value="">Selecciona una mesa</option>';

  mesas.forEach(m => {
    const numero = typeof m === "object" ? m.numero : m; // manejar ambos casos
    const opt = document.createElement("option");
    opt.value = numero;
    opt.textContent = `Mesa ${numero}`;
    mesaSelect.appendChild(opt);
  });
}

// 🧼 Reset
export function resetFormulario() {
  const pedidoForm = document.getElementById("pedidoForm");
  pedidoForm.innerHTML = "<p class='text-gray-500 text-center py-4'>Haz clic en los productos del menú para agregarlos aquí.</p>";
  contador = 0;
  const mesaValida = document.getElementById("mesa").value;
  document.getElementById("enviarCocina").disabled = !mesaValida;
}

// ➕ Agregar línea desde botón visual
export function agregarLineaConProducto(nombreProducto) {
  const tipoCuenta = document.getElementById("tipoCuenta").value;
  const pedidoForm = document.getElementById("pedidoForm");

  if (tipoCuenta === 'separada') {
    let clienteActual = pedidoForm.querySelector(".bloqueClienteActual");

    if (!clienteActual) {
      clienteActual = document.createElement("div");
      clienteActual.className = "bloqueClienteActual mb-4 border rounded p-3 bg-white";

      const inputNombre = document.createElement("input");
      inputNombre.type = "text";
      inputNombre.placeholder = "Nombre del cliente";
      inputNombre.className = "nombre w-full p-2 mb-2 border rounded";
      inputNombre.required = true;

      const divProductos = document.createElement("div");
      divProductos.className = "productos space-y-2";

      clienteActual.appendChild(inputNombre);
      clienteActual.appendChild(divProductos);
      pedidoForm.appendChild(clienteActual);
    }

    const divProductos = clienteActual.querySelector(".productos");

    const div = document.createElement("div");
    div.className = "producto-item";

    div.innerHTML = `
      <div class="mb-1 font-medium">${nombreProducto}</div>
      <input type="hidden" class="producto" value="${nombreProducto}" />
      <input type="number" placeholder="Cantidad" class="cantidad w-full p-2 border rounded" required min="1" value="1" />
    `;

    divProductos.appendChild(div);
    document.getElementById("enviarCocina").disabled = false;

  } else {
    const div = document.createElement("div");
    div.className = "border p-3 rounded bg-white espacioPedido";

    div.innerHTML = `
      <div class="mb-1 font-medium">${nombreProducto}</div>
      <input type="hidden" class="producto" value="${nombreProducto}" />
      <input type="number" placeholder="Cantidad" class="cantidad w-full p-2 border rounded" required min="1" value="1" />
    `;

    pedidoForm.appendChild(div);
    document.getElementById("enviarCocina").disabled = false;
  }
}

// ➕ Agregar línea manual (opcional si se llama desde un botón externo)
export function agregarLineaPedido(tipoCuenta) {
  const pedidoForm = document.getElementById("pedidoForm");
  contador++;

  const div = document.createElement("div");
  div.className = "border p-3 rounded bg-white espacioPedido";

  div.innerHTML = `
    ${tipoCuenta === 'separada'
      ? '<input type="text" placeholder="Nombre del cliente" class="nombre w-full p-2 mb-2 border rounded" required />'
      : ''}
    <input type="text" placeholder="Producto" class="producto w-full p-2 mb-2 border rounded" required />
    <input type="number" placeholder="Cantidad" class="cantidad w-full p-2 border rounded" required min="1" value="1" />
  `;

  pedidoForm.appendChild(div);
  document.getElementById("enviarCocina").disabled = false;
}

// 📦 Obtener items
export function obtenerItemsDelFormulario(tipoCuenta) {
  const items = [];
  let incompletos = false;

  if (tipoCuenta === 'separada') {
    document.querySelectorAll(".bloqueClienteActual").forEach(bloque => {
      const nombre = bloque.querySelector(".nombre")?.value.trim();
      if (!nombre) {
        bloque.querySelector(".nombre").classList.add("border-red-500");
        incompletos = true;
        return;
      }

      const productos = bloque.querySelectorAll(".producto-item");
      productos.forEach(p => {
        const prodVal = p.querySelector(".producto")?.value.trim();
        const cantInput = p.querySelector(".cantidad");
        const cantVal = parseInt(cantInput.value);

        if (!prodVal || isNaN(cantVal) || cantVal < 1) {
          incompletos = true;
          if (!prodVal) p.querySelector(".producto").classList.add("border-red-500");
          if (isNaN(cantVal) || cantVal < 1) cantInput.classList.add("border-red-500");
        } else {
          items.push({ nombre, producto: prodVal, cantidad: cantVal });
        }
      });
    });
  } else {
    document.querySelectorAll(".espacioPedido").forEach(div => {
      const producto = div.querySelector(".producto");
      const cantidad = div.querySelector(".cantidad");

      producto.classList.remove("border-red-500");
      cantidad.classList.remove("border-red-500");

      const prodVal = producto.value.trim();
      const cantVal = parseInt(cantidad.value);

      if (!prodVal || isNaN(cantVal) || cantVal < 1) {
        incompletos = true;
        if (!prodVal) producto.classList.add("border-red-500");
        if (isNaN(cantVal) || cantVal < 1) cantidad.classList.add("border-red-500");
      } else {
        items.push({ producto: prodVal, cantidad: cantVal });
      }
    });
  }

  return { items, incompletos };
}

// 📬 Pedidos listos
export function renderizarPedidosListos(pedidos, onRecibir) {
  const listaListos = document.getElementById("listaListos");
  listaListos.innerHTML = "";

  const nuevos = pedidos.filter(p => !pedidosAnteriores.some(prev => prev.id === p.id));
  if (nuevos.length > 0) SONIDO.play().catch(() => {});
  pedidosAnteriores = pedidos;

  if (pedidos.length === 0) {
    listaListos.innerHTML = "<p class='text-gray-500'>No hay pedidos listos.</p>";
    return;
  }

  pedidos.forEach(p => {
    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded shadow border mb-2";

    let items = [];
    try {
      items = Array.isArray(p.items) ? p.items : JSON.parse(p.items);
    } catch {}

    div.innerHTML = `
      <h3 class="font-bold">🪑 Mesa ${p.mesa}</h3>
      <ul class="list-disc ml-6">
        ${items.map(i => `<li>${i.cantidad} × ${i.producto}${i.nombre ? ` (para ${i.nombre})` : ''}</li>`).join("")}
      </ul>
      <button class="mt-2 bg-blue-600 text-white px-3 py-1 rounded">📥 Recibido</button>
    `;

    div.querySelector("button").addEventListener("click", () => onRecibir(p.id));
    listaListos.appendChild(div);
  });
}

// 🍽️ Menú visual por categorías
const API_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:5000/api"
  : "https://restaurante-mqgs.onrender.com/api";

export async function cargarMenuVisual() {
  try {
    const res = await fetch(`${API_BASE}/productos-agrupados`, { credentials: "include" });
    const data = await res.json();

    const contenedor = document.getElementById("menuVisual");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    Object.entries(data).forEach(([categoria, productos]) => {
      const seccion = document.createElement("section");

      const titulo = document.createElement("h3");
      titulo.textContent = categoria;
      titulo.className = "text-lg font-bold text-gray-700 mb-2";
      seccion.appendChild(titulo);

      const grid = document.createElement("div");
      grid.className = "grid grid-cols-2 md:grid-cols-3 gap-3";

      productos.forEach(p => {
        const btn = document.createElement("button");
        btn.textContent = `${p.nombre} ($${parseFloat(p.precio).toFixed(2)})`;
        btn.className = "bg-white border border-gray-300 hover:bg-green-100 p-3 rounded shadow text-sm";
        btn.onclick = () => agregarLineaConProducto(p.nombre);
        grid.appendChild(btn);
      });

      seccion.appendChild(grid);
      contenedor.appendChild(seccion);
    });
  } catch (err) {
    console.error("❌ Error al cargar menú visual:", err);
  }
}

