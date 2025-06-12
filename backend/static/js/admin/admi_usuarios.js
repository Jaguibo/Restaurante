document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "/api";  // ✅ se elimina localhost para compatibilidad con producción
  const formUsuario = document.getElementById("formUsuario");
  const usuariosLista = document.getElementById("usuariosLista");
  const msgUsuario = document.getElementById("msgUsuario");

  // ✅ Mostrar mensajes temporales
  const mostrarMensaje = (mensaje, exito = true) => {
    msgUsuario.textContent = mensaje;
    msgUsuario.className = exito ? "text-green-600" : "text-red-600";
    setTimeout(() => msgUsuario.textContent = "", 3000);
  };

  // ✅ Crear elemento DOM para un usuario
  const crearElementoUsuario = ({ usuario, rol }) => {
    const div = document.createElement("div");
    div.className = "p-2 bg-white shadow rounded mb-2 flex justify-between items-center";
    div.innerHTML = `
      <span class="text-gray-800">${usuario} (${rol})</span>
      <button data-usuario="${usuario}" class="btnEliminarUsuario text-red-600 hover:underline">🗑️</button>
    `;
    return div;
  };

  // ✅ Cargar lista de usuarios
  async function cargarUsuarios() {
    usuariosLista.innerHTML = "<p class='text-gray-500'>Cargando usuarios...</p>";
    try {
      const res = await fetch(`${BASE_URL}/usuarios`, { credentials: "include" });
      if (!res.ok) throw new Error("Fallo en la carga de usuarios");
      const data = await res.json();
      usuariosLista.innerHTML = "";
      data.forEach(usuario => {
        usuariosLista.appendChild(crearElementoUsuario(usuario));
      });
    } catch (err) {
      console.warn("❌ Error al cargar usuarios:", err);
      usuariosLista.innerHTML = "<p class='text-red-600'>Error al cargar usuarios.</p>";
    }
  }

  // ✅ Enviar nuevo usuario
  formUsuario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuNombre").value;
    const password = document.getElementById("usuPass").value;
    const rol = document.getElementById("usuRol").value;

    try {
      const res = await fetch(`${BASE_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario, password, rol })
      });

      if (!res.ok) {
        mostrarMensaje("❌ Error al agregar usuario", false);
      } else {
        mostrarMensaje("✅ Usuario agregado");
        formUsuario.reset();
        cargarUsuarios();
      }
    } catch (err) {
      console.warn("❌ Error al agregar usuario:", err);
      mostrarMensaje("❌ Fallo inesperado", false);
    }
  });

  // ✅ Delegar evento de eliminar usuario
  usuariosLista.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btnEliminarUsuario")) return;

    const usuario = e.target.dataset.usuario;
    if (!confirm(`¿Eliminar al usuario ${usuario}?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/usuarios/${usuario}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        mostrarMensaje("❌ No se pudo eliminar usuario", false);
      } else {
        mostrarMensaje("✅ Usuario eliminado");
        cargarUsuarios();
      }
    } catch (err) {
      console.warn("❌ Error eliminando usuario:", err);
      mostrarMensaje("❌ Error inesperado", false);
    }
  });

  // 🚀 Inicial
  cargarUsuarios();
});
