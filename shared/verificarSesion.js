/**
 * 🔐 Verifica la sesión del usuario según el rol necesario para la vista actual.
 * Debe incluirse con: <script defer src="..." data-rol="admin|mesero|cocinero">
 */
(async function () {
  const currentScript = document.currentScript;
  const rolEsperado = currentScript?.dataset?.rol;

  if (!rolEsperado) {
    console.warn("⚠️ No se especificó 'data-rol' en el script de verificación.");
    return;
  }

  console.log(`[SESSION] Verificando sesión para rol requerido: "${rolEsperado}"`);

  try {
    const res = await fetch("http://localhost:5000/api/verificar", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      console.warn(`⚠️ Respuesta HTTP inválida. Código: ${res.status}`);
      return redirigir(rolEsperado);
    }

    const data = await res.json();

    if (!data.ok || data.rol !== rolEsperado) {
      console.warn(`⚠️ Usuario no autorizado. Rol actual: "${data?.rol}", requerido: "${rolEsperado}"`);
      return redirigir(rolEsperado);
    }

    const usuario = data.usuario;
    console.log(`✅ Sesión verificada: ${usuario} (rol: ${data.rol}) @ ${new Date().toLocaleString()}`);

    mostrarNombreUsuario(usuario);
    agregarBotonLogout(usuario);

  } catch (err) {
    console.error("❌ Error al verificar la sesión:", err);
    redirigir(rolEsperado);
  }

  function redirigir(rol) {
    const rutas = {
      admin: "/login.html",
      mesero: "/login.html",
      cocinero: "/login.html"
    };
    window.location.href = rutas[rol] || "/";
  }

  function agregarBotonLogout(nombreUsuario) {
    const contenedor = document.createElement("div");
    contenedor.className = "fixed top-4 right-4 flex items-center gap-2 bg-white border p-2 rounded shadow z-50";

    const saludo = document.createElement("span");
    saludo.textContent = `👋 ${nombreUsuario}`;
    saludo.className = "text-sm text-gray-700";

    const btn = document.createElement("button");
    btn.textContent = "Cerrar sesión";
    btn.className = "text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded";
    btn.setAttribute("aria-label", "Cerrar sesión");

    btn.addEventListener("click", async () => {
      try {
        await fetch("http://localhost:5000/api/logout", {
          method: "POST",
          credentials: "include"
        });
        console.log(`[LOGOUT] Sesión cerrada por el usuario: ${nombreUsuario}`);
      } catch (err) {
        console.error("❌ Error al cerrar sesión:", err);
      } finally {
        redirigir(rolEsperado);
      }
    });

    contenedor.appendChild(saludo);
    contenedor.appendChild(btn);
    document.body.appendChild(contenedor);
  }

  function mostrarNombreUsuario(nombre) {
    const id = rolEsperado === "cocinero" ? "cocinaNombre" : `${rolEsperado}Nombre`;
    const destino = document.getElementById(id);

    if (destino) {
      destino.textContent = nombre;
    } else {
      console.warn(`⚠️ No se encontró un elemento con ID "${id}" para mostrar el nombre.`);
    }
  }
})();
