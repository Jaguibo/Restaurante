document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "/api";

  const formUsuario = document.getElementById("formUsuario");
  const usuariosLista = document.getElementById("usuariosLista");
  const msgUsuario = document.getElementById("msgUsuario");

  async function cargarUsuarios() {
    usuariosLista.innerHTML = "<p>Cargando...</p>";
    try {
      const res = await fetch(`${BASE_URL}/usuarios`, { credentials: "include" });
      if (!res.ok) throw new Error("Fallo al obtener usuarios");
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

      msgUsuario.textContent = res.ok
        ? "✅ Usuario eliminado"
        : "❌ Error al eliminar usuario";

      if (res.ok) cargarUsuarios();

    } catch (err) {
      console.warn("❌ Error en la petición de eliminar usuario:", err);
    }

    setTimeout(() => msgUsuario.textContent = "", 3000);
  };

  formUsuario.onsubmit = async (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuNombre").value.trim();
    const password = document.getElementById("usuPass").value.trim();
    const rol = document.getElementById("usuRol").value;

    if (!usuario || !password || !rol) {
      msgUsuario.textContent = "❌ Todos los campos son requeridos.";
      setTimeout(() => msgUsuario.textContent = "", 3000);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario, password, rol })
      });

      msgUsuario.textContent = res.ok
        ? "✅ Usuario agregado"
        : "❌ Error al agregar usuario";

      if (res.ok) {
        formUsuario.reset();
        cargarUsuarios();
      }

    } catch (err) {
      console.warn("❌ Error en la petición de agregar usuario:", err);
    }

    setTimeout(() => msgUsuario.textContent = "", 3000);
  };

  cargarUsuarios();
});
