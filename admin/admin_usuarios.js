document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:5000/api";
  const formUsuario = document.getElementById("formUsuario");
  const usuariosLista = document.getElementById("usuariosLista");
  const msgUsuario = document.getElementById("msgUsuario");

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
        body: JSON.stringify({ usuario, password, rol })
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

  cargarUsuarios();
});
