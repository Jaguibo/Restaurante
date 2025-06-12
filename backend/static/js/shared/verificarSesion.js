(async function () {
  const currentScript = document.currentScript;
  const rolEsperado = currentScript?.dataset?.rol;

  // 🔁 Detectar entorno
  const API_BASE = window.location.hostname.includes("localhost")
    ? "http://localhost:5000/api"
    : "https://restaurante-mqgs.onrender.com/api";

  if (!rolEsperado) {
    console.warn("⚠️ No se especificó 'data-rol' en el script de verificación.");
    return;
  }

  console.log(`[SESSION] Verificando sesión para rol requerido: "${rolEsperado}"`);

  try {
    const res = await fetch(`${API_BASE}/verificar`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      console.warn(`⚠️ Sesión no válida. Código HTTP: ${res.status}`);
      return redirigirLogin();
    }

    const data = await res.json();

    if (!data.ok || data.rol !== rolEsperado) {
      console.warn(`⚠️ Acceso denegado. Rol actual: "${data?.rol}", requerido: "${rolEsperado}"`);
      return redirigirLogin();
    }

    console.log(`✅ Sesión activa como ${data.usuario} (${data.rol})`);

    mostrarNombreUsuario(data.usuario);
    agregarBotonLogout(data.usuario);

  } catch (err) {
    console.error("❌ Error al verificar sesión:", err);
    redirigirLogin();
  }

  function redirigirLogin() {
    console.warn("🔁 Redirigiendo a login desde:", window.location.href);
    window.location.href = "/login.html";
  }

  function mostrarNombreUsuario(nombre) {
    const id = rolEsperado === "cocinero" ? "cocinaNombre" : `${rolEsperado}Nombre`;
    const destino = document.getElementById(id);
    if (destino) {
      destino.textContent = nombre;
    } else {
      console.warn(`⚠️ No se encontró el elemento con ID "${id}" para mostrar el usuario.`);
    }
  }

  function agregarBotonLogout(usuario) {
    const contenedor = document.createElement("div");
    contenedor.className = "fixed top-4 right-4 flex items-center gap-2 bg-white border p-2 rounded shadow z-50";

    const saludo = document.createElement("span");
    saludo.textContent = `👋 ${usuario}`;
    saludo.className = "text-sm text-gray-700";

    const btn = document.createElement("button");
    btn.textContent = "Cerrar sesión";
    btn.className = "text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded";
    btn.setAttribute("aria-label", "Cerrar sesión");

    btn.onclick = async () => {
      try {
        await fetch(`${API_BASE}/logout`, {
          method: "POST",
          credentials: "include"
        });
        console.log(`[LOGOUT] Usuario ${usuario} cerró sesión.`);
      } catch (err) {
        console.error("❌ Error al cerrar sesión:", err);
      } finally {
        redirigirLogin();
      }
    };

    contenedor.appendChild(saludo);
    contenedor.appendChild(btn);
    document.body.appendChild(contenedor);
  }
})();
