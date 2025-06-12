document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "/api";
  const formProducto = document.getElementById("formProducto");
  const productosLista = document.getElementById("productosLista");
  const msgProducto = document.getElementById("msgProducto");

  const mostrarMensaje = (msg, exito = true) => {
    msgProducto.textContent = msg;
    msgProducto.className = exito ? "text-green-600" : "text-red-600";
    setTimeout(() => msgProducto.textContent = "", 3000);
  };

  const renderProducto = ({ id, nombre, precio, categoria }) => {
    const div = document.createElement("div");
    div.className = "p-2 bg-white shadow rounded mb-2 flex justify-between items-center";

    const info = document.createElement("span");
    info.textContent = `${nombre} - $${precio.toFixed(2)} (${categoria})`;

    const acciones = document.createElement("div");

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "✏️";
    btnEditar.className = "text-blue-600 mr-2";
    btnEditar.addEventListener("click", () => cargarFormulario(id, nombre, precio, categoria));

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "🗑️";
    btnEliminar.className = "text-red-600";
    btnEliminar.addEventListener("click", () => eliminarProducto(id));

    acciones.append(btnEditar, btnEliminar);
    div.append(info, acciones);
    return div;
  };

  const cargarFormulario = (id, nombre, precio, categoria) => {
    document.getElementById("prodId").value = id;
    document.getElementById("prodNombre").value = nombre;
    document.getElementById("prodPrecio").value = precio;
    document.getElementById("prodCat").value = categoria;
  };

  const cargarProductos = async () => {
    productosLista.innerHTML = "<p class='text-gray-500'>Cargando productos...</p>";
    try {
      const res = await fetch(`${BASE_URL}/productos`, { credentials: "include" });
      if (!res.ok) throw new Error("No se pudo cargar productos");
      const data = await res.json();
      productosLista.innerHTML = "";
      data.forEach(p => productosLista.appendChild(renderProducto(p)));
    } catch (err) {
      console.warn("❌ Error cargando productos:", err);
      productosLista.innerHTML = "<p class='text-red-600'>Error al cargar productos.</p>";
    }
  };

  const eliminarProducto = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      const res = await fetch(`${BASE_URL}/productos/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) {
        mostrarMensaje("❌ Error al eliminar producto", false);
      } else {
        mostrarMensaje("✅ Producto eliminado");
        cargarProductos();
      }
    } catch (err) {
      console.warn("❌ Error eliminando producto:", err);
      mostrarMensaje("❌ Fallo inesperado", false);
    }
  };

  formProducto.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("prodId").value;
    const nombre = document.getElementById("prodNombre").value.trim();
    const precio = parseFloat(document.getElementById("prodPrecio").value);
    const categoria = document.getElementById("prodCat").value.trim();

    if (!nombre || isNaN(precio)) {
      return mostrarMensaje("❌ Nombre y precio son requeridos", false);
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
        mostrarMensaje("❌ Error al guardar producto", false);
      } else {
        mostrarMensaje(id ? "✅ Producto actualizado" : "✅ Producto agregado");
        formProducto.reset();
        document.getElementById("prodId").value = "";
        cargarProductos();
      }
    } catch (err) {
      console.warn("❌ Error al guardar producto:", err);
      mostrarMensaje("❌ Fallo inesperado", false);
    }
  };

  cargarProductos();
});
