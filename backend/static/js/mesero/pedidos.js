import { mostrarFormularioCierre } from './cierre_dom.js'; // Asegúrate de tenerlo

document.addEventListener("DOMContentLoaded", async () => {
  const pedidoForm = document.getElementById("pedidoForm");
  const tipoCuenta = document.getElementById("tipoCuenta");
  const agregarPedido = document.getElementById("agregarPedido");
  const enviarCocina = document.getElementById("enviarCocina");
  const meseroNombre = document.getElementById("meseroNombre");
  const errorDisplay = document.getElementById("error");
  const listaListos = document.getElementById("listaListos");
  const mesaSelect = document.getElementById("mesa");

  const SONIDO = new Audio("assets/notificacion.mp3");
  let mesero = "";
  let contador = 0;
  let pedidosAnteriores = [];

  // 🔐 Verificar sesión
  try {
    const res = await fetch("/api/verificar", { credentials: "include" });
    const data = await res.json();
    if (!data.ok || data.rol !== "mesero") throw new Error("No autorizado");
    mesero = data.usuario;
    meseroNombre.textContent = mesero;
  } catch {
    window.location.href = "login.html";
    return;
  }

  // 🔄 Cargar mesas dinámicamente
  async function cargarMesas() {
    try {
      const res = await fetch("/api/mesas", { credentials: "include" });
      const mesas = await res.json();
      mesaSelect.innerHTML = '<option value="">Selecciona una mesa</option>';
      mesas.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.numero;
        opt.textContent = `Mesa ${m.numero}`;
        mesaSelect.appendChild(opt);
      });
    } catch {
      mesaSelect.innerHTML = '<option value="">Error al cargar mesas</option>';
    }
  }

  cargarMesas();

  function resetFormulario() {
    pedidoForm.innerHTML = "";
    contador = 0;
    agregarPedido.disabled = !mesaSelect.value;
    enviarCocina.disabled = !mesaSelect.value;
  }

  tipoCuenta.addEventListener("change", resetFormulario);
  mesaSelect.addEventListener("change", resetFormulario);

  agregarPedido.addEventListener("click", () => {
    const cuenta = tipoCuenta.value;
    contador++;
    const div = document.createElement("div");
    div.className = "border p-3 rounded bg-white espacioPedido";

    div.innerHTML = `
      ${cuenta === 'separada' ? '<input type="text" placeholder="Nombre del cliente" class="nombre w-full p-2 mb-2 border rounded" required />' : ''}
      <input type="text" placeholder="Producto" class="producto w-full p-2 mb-2 border rounded" required />
      <input type="number" placeholder="Cantidad" class="cantidad w-full p-2 border rounded" required min="1" value="1" />
    `;

    pedidoForm.appendChild(div);
  });

  enviarCocina.addEventListener("click", async () => {
    const mesa = mesaSelect.value;
    const cuenta = tipoCuenta.value;
    const items = [];

    if (!mesa) {
      mostrarError("⚠️ Debes seleccionar una mesa.");
      return;
    }

    let camposIncompletos = false;

    document.querySelectorAll(".espacioPedido").forEach(div => {
      const nombre = div.querySelector(".nombre")?.value.trim() || null;
      const producto = div.querySelector(".producto");
      const cantidad = div.querySelector(".cantidad");

      producto.classList.remove("border-red-500");
      cantidad.classList.remove("border-red-500");

      const prodVal = producto.value.trim();
      const cantVal = parseInt(cantidad.value);

      if (!prodVal || isNaN(cantVal) || cantVal < 1 || (cuenta === 'separada' && !nombre)) {
        camposIncompletos = true;
        if (!prodVal) producto.classList.add("border-red-500");
        if (isNaN(cantVal) || cantVal < 1) cantidad.classList.add("border-red-500");
        return;
      }

      items.push({ nombre, producto: prodVal, cantidad: cantVal });
    });

    if (camposIncompletos || items.length === 0) {
      mostrarError("⚠️ Completa correctamente todos los campos antes de enviar.");
      return;
    }

    const payload = {
      mesa,
      cuenta,
      items,
      mesero,
      fecha: new Date().toISOString().split("T")[0]
    };

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error al enviar pedido");

      alert("✅ Pedido enviado correctamente.");
      resetFormulario();
    } catch {
      mostrarError("❌ Error al enviar el pedido.");
    }
  });

  function mostrarError(msg) {
    errorDisplay.textContent = msg;
    errorDisplay.classList.remove("hidden");
    errorDisplay.setAttribute("aria-live", "assertive");
  }

  async function cargarPedidosListos() {
    try {
      const res = await fetch("/api/pedidos-listos", { credentials: "include" });
      const pedidos = await res.json();
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

        p.items = items; // 👈 Aseguramos que tenga items listos para cierre

        div.innerHTML = `
          <h3 class="font-bold">🪑 Mesa ${p.mesa}</h3>
          <ul class="list-disc ml-6">
            ${items.map(i => `<li>${i.cantidad} × ${i.producto}${i.nombre ? ` (para ${i.nombre})` : ''}</li>`).join("")}
          </ul>
          <button class="mt-2 bg-blue-600 text-white px-3 py-1 rounded">📥 Recibido</button>
        `;

        div.querySelector("button").addEventListener("click", async () => {
          try {
            const res = await fetch(`/api/pedido-recibido/${p.id}`, {
              method: "POST",
              credentials: "include"
            });

            if (!res.ok) throw new Error();

            alert("✅ Pedido marcado como recibido.");
            cargarPedidosListos();
            mostrarFormularioCierre(p); // 👈 Muestra formulario de cierre
          } catch {
            alert("❌ Error al marcar como recibido.");
          }
        });

        listaListos.appendChild(div);
      });
    } catch {
      listaListos.innerHTML = "<p class='text-red-500'>Error al cargar pedidos listos.</p>";
    }
  }

  await cargarPedidosListos();
  setInterval(cargarPedidosListos, 60000);
});
