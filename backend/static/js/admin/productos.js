document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "/api";
  const formProducto = document.getElementById("formProducto");
  const productosLista = document.getElementById("productosLista");
  const msgProducto = document.getElementById("msgProducto");

  init();

  async function init() {
    console.log("🛠️ [AdminProductos] Inicializando módulo de productos...");
    await cargarProductos();
    formProducto.addEventListener("submit", manejarEnvioFormulario);
  }

  async function cargarProductos() {
    productosLista.innerHTML = "<p class='text-gray-500'>Cargando productos...</p>";

    try {
      const res = await fetch(`${BASE_URL}/productos`, { credentials: "include" });
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

      const data = await res.json();
      productosLista.innerHTML = "";

      if (!Array.isArray(data)) {
        console.warn("⚠️ [AdminProductos] Respuesta no válida:", data);
        mostrarMensaje("❌ Respuesta del servidor no válida.", "error");
        return;
      }

      if (data.length === 0) {
        productosLista.innerHTML = "<p class='text-gray-500'>No hay productos registrados.</p>";
        return;
      }

      data.forEach(producto => renderProducto(producto));
      console.log(`✅ [AdminProductos] ${data.length} producto(s) cargado(s).`);
    } catch (err) {
      console.error("❌ [AdminProductos] Error al cargar productos:", err);
      productosLista.innerHTML = "<p class='text-red-600'>Error al cargar productos.</p>";
    }
  }

  function renderProducto(p) {
    const div = document.createElement("div");
    div.className = "p-2 bg-white shadow rounded mb-2 flex justify-between";

    div.innerHTML = `
      <div><strong>${p.nombre}</strong> - $${p.precio.toFixed(2)} (${p.categoria})</div>
      <div>
        <button class="text-blue-600" data-id="${p.id}" data-action="editar">✏️</button>
        <button class="text-red-600 ml-2" data-id="${p.id}" data-action="eliminar">🗑️</button>
      </div>
    `;

    div.querySelectorAll("button").forEach(btn => {
      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id);

      if (action === "editar") {
        btn.addEventListener("click", () => llenarFormulario(p));
      } else if (action === "eliminar") {
        btn.addEventListener("click", () => eliminarProducto(id));
      }
    });

    productosLista.appendChild(div);
  }

  function llenarFormulario({ id, nombre, precio, categoria }) {
    formProducto.prodId.value = id;
    formProducto.prodNombre.value = nombre;
    formProducto.prodPrecio.value = precio;
    formProducto.prodCat.value = categoria;
  }

  async function eliminarProducto(id) {
    if (!confirm("¿Eliminar este producto?")) return;

    try {
      const res = await fetch(`${BASE_URL}/productos/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        mostrarMensaje("❌ Error al eliminar producto.", "error");
        return;
      }

      mostrarMensaje("✅ Producto eliminado");
      await cargarProductos();
    } catch (err) {
      console.error("❌ [AdminProductos] Error al eliminar:", err);
      mostrarMensaje("❌ Error al conectar con el servidor.", "error");
    }
  }

  async function manejarEnvioFormulario(e) {
    e.preventDefault();

    const id = formProducto.prodId.value;
    const nombre = formProducto.prodNombre.value.trim();
    const precio = parseFloat(formProducto.prodPrecio.value);
    const categoria = formProducto.prodCat.value.trim();

    if (!nombre || isNaN(precio) || !categoria) {
      mostrarMensaje("⚠️ Todos los campos son obligatorios.", "error");
      return;
    }

    const payload = { nombre, precio, categoria };
    const url = id ? `${BASE_URL}/productos/${id}` : `${BASE_URL}/productos`;
    const method = id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        mostrarMensaje("❌ Error al guardar producto.", "error");
        return;
      }

      mostrarMensaje(id ? "✅ Producto actualizado" : "✅ Producto agregado");
      formProducto.reset();
      formProducto.prodId.value = "";
      await cargarProductos();
    } catch (err) {
      console.error("❌ [AdminProductos] Error al guardar producto:", err);
      mostrarMensaje("❌ Error al conectar con el servidor.", "error");
    }
  }

  function mostrarMensaje(msg, tipo = "success") {
    msgProducto.textContent = msg;
    msgProducto.className = tipo === "error" ? "text-red-600" : "text-green-600";
    setTimeout(() => {
      msgProducto.textContent = "";
      msgProducto.className = "";
    }, 3000);
  }
});
