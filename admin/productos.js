document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:5000/api";
  const formProducto = document.getElementById("formProducto");
  const productosLista = document.getElementById("productosLista");
  const msgProducto = document.getElementById("msgProducto");

  async function cargarProductos() {
    productosLista.innerHTML = "<p>Cargando...</p>";
    try {
      const res = await fetch(`${BASE_URL}/productos`, { credentials: "include" });
      const data = await res.json();
      productosLista.innerHTML = "";
      data.forEach(p => {
        const div = document.createElement("div");
        div.className = "p-2 bg-white shadow rounded mb-2 flex justify-between";
        div.innerHTML = `
          <div><strong>${p.nombre}</strong> - $${p.precio.toFixed(2)} (${p.categoria})</div>
          <div>
            <button onclick="editarProducto(${p.id}, '${p.nombre}', ${p.precio}, '${p.categoria}')" class="text-blue-600">✏️</button>
            <button onclick="eliminarProducto(${p.id})" class="text-red-600 ml-2">🗑️</button>
          </div>
        `;
        productosLista.appendChild(div);
      });
    } catch (err) {
      console.warn("❌ Error al cargar productos:", err);
      productosLista.innerHTML = "<p class='text-red-600'>Error al cargar productos.</p>";
    }
  }

  window.editarProducto = (id, nombre, precio, categoria) => {
    document.getElementById("prodId").value = id;
    document.getElementById("prodNombre").value = nombre;
    document.getElementById("prodPrecio").value = precio;
    document.getElementById("prodCat").value = categoria;
  };

  window.eliminarProducto = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      const res = await fetch(`${BASE_URL}/productos/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        msgProducto.textContent = "❌ Error al eliminar producto.";
      } else {
        msgProducto.textContent = "✅ Producto eliminado";
        cargarProductos();
      }
    } catch (err) {
      console.warn("❌ Error en la petición de eliminar producto:", err);
    }

    setTimeout(() => msgProducto.textContent = "", 3000);
  };

  formProducto.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("prodId").value;
    const nombre = document.getElementById("prodNombre").value;
    const precio = parseFloat(document.getElementById("prodPrecio").value);
    const categoria = document.getElementById("prodCat").value;

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
        msgProducto.textContent = "❌ Error al guardar producto.";
      } else {
        msgProducto.textContent = id ? "✅ Producto actualizado" : "✅ Producto agregado";
        formProducto.reset();
        document.getElementById("prodId").value = "";
        cargarProductos();
      }
    } catch (err) {
      console.warn("❌ Error en la petición de guardar producto:", err);
    }

    setTimeout(() => msgProducto.textContent = "", 3000);
  };

  cargarProductos();
});
