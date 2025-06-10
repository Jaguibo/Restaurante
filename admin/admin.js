document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:5000/api";

  const formProducto = document.getElementById("formProducto");
  const productosLista = document.getElementById("productosLista");
  const msgProducto = document.getElementById("msgProducto");

  const formUsuario = document.getElementById("formUsuario");
  const usuariosLista = document.getElementById("usuariosLista");
  const msgUsuario = document.getElementById("msgUsuario");

  const ventasTotalesEl = document.getElementById("ventasTotales");
  const totalPropinasEl = document.getElementById("totalPropinas");
  const mesasTotalesEl = document.getElementById("mesasTotales");
  const activosEl = document.getElementById("activos");
  const tabla = document.getElementById("tablaVentas");

  async function cargarResumenDelDia() {
    try {
      const res = await fetch(`${BASE_URL}/ventas-dia`, {
        method: "GET",
        credentials: "include"
      });
      const data = await res.json();
      const resumen = data.resumen || {};
      const ventas = Array.isArray(data.ultimas_ventas) ? data.ultimas_ventas : [];
      const pedidosActivos = data.pedidos_activos?.total ?? 0;

      if (ventasTotalesEl) ventasTotalesEl.textContent = `$${(resumen.monto_total || 0).toFixed(2)}`;
      if (totalPropinasEl) totalPropinasEl.textContent = `$${(resumen.total_propinas || 0).toFixed(2)}`;
      if (mesasTotalesEl) mesasTotalesEl.textContent = resumen.mesas_atendidas ?? "-";
      if (activosEl) activosEl.textContent = pedidosActivos;

      if (tabla) {
        tabla.innerHTML = ventas.length
          ? ventas.map(v => `
              <tr class="border-t">
                <td class="p-2">${v.mesa}</td>
                <td class="p-2">$${v.total.toFixed(2)}</td>
                <td class="p-2">$${v.propina.toFixed(2)}</td>
                <td class="p-2">${v.hora}</td>
              </tr>
            `).join("")
          : `<tr><td colspan="4" class="text-center p-4 text-gray-500">No hay ventas registradas hoy.</td></tr>`;
      }
    } catch (error) {
      console.warn("❌ Error al cargar resumen del día:", error);
      alert("❌ Error al cargar resumen del día.");
    }
  }

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

  async function cargarUsuarios() {
    usuariosLista.innerHTML = "<p>Cargando...</p>";
    try {
      const res = await fetch(`${BASE_URL}/usuarios`, { credentials: "include" });
      const data = await res.json();
      usuariosLista.innerHTML = "";
      data.forEach(u => {
        const div = document.createElement("div");
        div.className = "p-2 bg-white shadow rounded mb-2 flex justify-between";
        div.innerHTML = `
          <div>${u.usuario} (${u.rol})</div>
          <button onclick="eliminarUsuario('${u.usuario}')" class="text-red-600">🗑️</button>
        `;
        usuariosLista.appendChild(div);
      });
    } catch (err) {
      console.warn("❌ Error al cargar usuarios:", err);
      usuariosLista.innerHTML = "<p class='text-red-600'>Error al cargar usuarios.</p>";
    }
  }

  window.eliminarUsuario = async (usuario) => {
    if (!confirm(`¿Eliminar al usuario ${usuario}?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/usuarios/${usuario}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        msgUsuario.textContent = "❌ Error al eliminar usuario.";
      } else {
        msgUsuario.textContent = "✅ Usuario eliminado";
        cargarUsuarios();
      }
    } catch (err) {
      console.warn("❌ Error en la petición de eliminar usuario:", err);
    }

    setTimeout(() => msgUsuario.textContent = "", 3000);
  };

formUsuario.onsubmit = async (e) => {
  e.preventDefault();
  const usuario = document.getElementById("usuNombre").value;
  const password = document.getElementById("usuPass").value;
  const rol = document.getElementById("usuRol").value;

  console.log("➕ Agregando usuario:", { usuario, rol });

  try {
    const res = await fetch(`${BASE_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ usuario, password, rol })  // ✅ AQUÍ
    });

    if (!res.ok) {
      msgUsuario.textContent = "❌ Error al agregar usuario.";
      console.warn("❌ Fallo al agregar usuario:", usuario);
    } else {
      msgUsuario.textContent = "✅ Usuario agregado";
      formUsuario.reset();
      cargarUsuarios();
    }
  } catch (err) {
    console.warn("❌ Error en la petición de agregar usuario:", err);
  }

  setTimeout(() => msgUsuario.textContent = "", 3000);
};


  cargarResumenDelDia();
  cargarProductos();
  cargarUsuarios();
});
