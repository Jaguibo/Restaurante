// pedidos_dom.js

const SONIDO = new Audio("assets/notificacion.mp3");
let contador = 0;
let pedidosAnteriores = [];

export function mostrarError(msg) {
  const errorDisplay = document.getElementById("error");
  errorDisplay.textContent = msg;
  errorDisplay.classList.remove("hidden");
  errorDisplay.setAttribute("aria-live", "assertive");
}

export function renderizarMesas(mesas) {
  const mesaSelect = document.getElementById("mesa");
  mesaSelect.innerHTML = '<option value="">Selecciona una mesa</option>';
  mesas.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.numero;
    opt.textContent = `Mesa ${m.numero}`;
    mesaSelect.appendChild(opt);
  });
}

export function resetFormulario() {
  const pedidoForm = document.getElementById("pedidoForm");
  pedidoForm.innerHTML = "";
  contador = 0;
  const mesaValida = document.getElementById("mesa").value;
  document.getElementById("agregarPedido").disabled = !mesaValida;
  document.getElementById("enviarCocina").disabled = !mesaValida;
}

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
}

export function obtenerItemsDelFormulario(tipoCuenta) {
  const items = [];
  let incompletos = false;

  document.querySelectorAll(".espacioPedido").forEach(div => {
    const nombre = div.querySelector(".nombre")?.value.trim() || null;
    const producto = div.querySelector(".producto");
    const cantidad = div.querySelector(".cantidad");

    producto.classList.remove("border-red-500");
    cantidad.classList.remove("border-red-500");

    const prodVal = producto.value.trim();
    const cantVal = parseInt(cantidad.value);

    if (!prodVal || isNaN(cantVal) || cantVal < 1 || (tipoCuenta === 'separada' && !nombre)) {
      incompletos = true;
      if (!prodVal) producto.classList.add("border-red-500");
      if (isNaN(cantVal) || cantVal < 1) cantidad.classList.add("border-red-500");
    } else {
      items.push({ nombre, producto: prodVal, cantidad: cantVal });
    }
  });

  return { items, incompletos };
}

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
