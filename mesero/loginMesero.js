document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formulario");
  const btnLogin = document.getElementById("btnLogin");
  const errorDisplay = document.getElementById("error");

  let intentosFallidos = 0;
  let bloqueoActivo = false;

  if (!form || !btnLogin || !errorDisplay) {
    console.error("❌ Elementos del DOM no encontrados.");
    return;
  }

  // Verifica si hay sesión recordada
  const sesionGuardada = localStorage.getItem("sesionMesero");
  if (sesionGuardada === "activa") {
    console.log("🔁 Sesión recordada encontrada. Redirigiendo automáticamente...");
    window.location.href = "/mesero/cuentas.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (bloqueoActivo) {
      mostrarError("🚫 Demasiados intentos. Espera unos segundos...");
      return;
    }

    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!usuario || !password) {
      mostrarError("⚠️ Debes completar todos los campos.");
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "🔐 Verificando...";
    errorDisplay.textContent = "";

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: usuario, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.rol === "mesero") {
          const horaInicio = new Date().toLocaleString();
          console.log(`✅ Login exitoso: ${data.usuario} (${data.rol}) a las ${horaInicio}`);
          localStorage.setItem("sesionMesero", "activa");

          // Opcional: registrar inicio de turno
          // await fetch("http://localhost:5000/api/log-acceso", { method: "POST", ... });

          window.location.href = "/mesero/cuentas.html";
        } else {
          mostrarError("🚫 Rol no autorizado.");
          console.warn(`⚠️ Usuario con rol inválido: ${data.rol}`);
        }
      } else if (res.status === 401) {
        intentosFallidos++;
        mostrarError("❌ Usuario o contraseña incorrectos.");
        console.warn("❌ Intento fallido de login. Intentos:", intentosFallidos);

        if (intentosFallidos >= 3) {
          bloqueoActivo = true;
          console.warn("🔒 Se activó el bloqueo temporal por múltiples fallos.");
          setTimeout(() => {
            bloqueoActivo = false;
            intentosFallidos = 0;
            console.log("🔓 Bloqueo levantado. Usuario puede volver a intentar.");
          }, 5000);
        }
      } else {
        mostrarError("⚠️ Error inesperado del servidor.");
        console.warn("⚠️ Respuesta inesperada del servidor:", res.status);
      }
    } catch (err) {
      console.error("❌ Error de red o del servidor:", err);
      mostrarError("❌ Error de conexión. Intenta más tarde.");
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = "✅ Iniciar Turno";
    }
  });

  function mostrarError(mensaje) {
    errorDisplay.textContent = mensaje;
    errorDisplay.classList.remove("hidden");
    errorDisplay.setAttribute("aria-live", "assertive");
  }
});


//borrare esto