// mesero_eventos.js
import { validarCampos, puedeIntentarLogin, registrarFallo } from './mesero_validacion.js';
import { autenticarMesero } from './mesero_autenticacion.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formulario");
  const btnLogin = document.getElementById("btnLogin");
  const errorDisplay = document.getElementById("error");

  if (!form || !btnLogin || !errorDisplay) {
    console.error("❌ Elementos del DOM no encontrados.");
    return;
  }

  const sesionGuardada = localStorage.getItem("sesionMesero");
  if (sesionGuardada === "activa") {
    console.log("🔁 Sesión recordada. Redirigiendo...");
    window.location.href = "/mesero/cuentas.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!puedeIntentarLogin()) {
      mostrarError("🚫 Demasiados intentos. Espera unos segundos...");
      return;
    }

    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();

    const error = validarCampos(usuario, password);
    if (error) return mostrarError(error);

    btnLogin.disabled = true;
    btnLogin.textContent = "🔐 Verificando...";
    errorDisplay.textContent = "";

    const res = await autenticarMesero(usuario, password);

    if (res.error) {
      mostrarError("❌ Error de conexión. Intenta más tarde.");
    } else if (res.status === 401) {
      registrarFallo(() => mostrarError("🚫 Demasiados intentos. Espera unos segundos..."));
      mostrarError("❌ Usuario o contraseña incorrectos.");
    } else if (res.status === 200 && res.data?.rol === "mesero") {
      const horaInicio = new Date().toLocaleString();
      console.log(`✅ Login exitoso: ${res.data.usuario} (${res.data.rol}) a las ${horaInicio}`);
      localStorage.setItem("sesionMesero", "activa");
      window.location.href = "/mesero/cuentas.html";
    } else {
      mostrarError("🚫 Rol no autorizado.");
      console.warn(`⚠️ Usuario con rol inválido: ${res.data?.rol}`);
    }

    btnLogin.disabled = false;
    btnLogin.textContent = "✅ Iniciar Turno";
  });

  function mostrarError(mensaje) {
    errorDisplay.textContent = mensaje;
    errorDisplay.classList.remove("hidden");
    errorDisplay.setAttribute("aria-live", "assertive");
  }
});
