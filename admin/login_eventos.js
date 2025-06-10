// eventos_login.js
import { validarCampos } from './validacion_login.js';
import { autenticarAdmin } from './autenticacion_admin.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const btnLogin = document.getElementById("btnLogin");
  const errorDisplay = document.getElementById("error");

  if (!form || !btnLogin || !errorDisplay) {
    console.error("❌ Elementos esenciales no encontrados en el DOM.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usuario = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const error = validarCampos(usuario, password);
    if (error) {
      errorDisplay.textContent = error;
      return;
    }

    console.log("🔐 Intentando iniciar sesión como:", usuario);
    btnLogin.disabled = true;
    btnLogin.textContent = "🔄 Verificando...";

    const resultado = await autenticarAdmin(usuario, password);

    if (resultado.success) {
      const { rol } = resultado.data;
      const rutas = {
        admin: "admin.html",
      };

      if (rutas[rol]) {
        console.log(`🚀 Redirigiendo a ${rutas[rol]}`);
        window.location.href = rutas[rol];
      } else {
        errorDisplay.textContent = "⚠️ No tienes permisos suficientes.";
        console.warn("⚠️ Rol sin acceso permitido:", rol);
      }
    } else {
      errorDisplay.textContent = resultado.error;
    }

    btnLogin.disabled = false;
    btnLogin.textContent = "Ingresar";
  });
});
