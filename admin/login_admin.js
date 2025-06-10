document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const form = document.getElementById("loginForm");
  const btnLogin = document.getElementById("btnLogin");
  const errorDisplay = document.getElementById("error");

  if (!form || !btnLogin || !errorDisplay) {
    console.error("❌ Elementos esenciales no encontrados en el DOM.");
    return;
  }

  // Escuchar evento de envío del formulario
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Obtener datos del formulario
    const usuario = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // Validación básica de campos vacíos
    if (!usuario || !password) {
      errorDisplay.textContent = "⚠️ Por favor, completa todos los campos.";
      console.warn("⚠️ Campos incompletos al intentar iniciar sesión.");
      return;
    }

    console.log("🔐 Intentando iniciar sesión como:", usuario);

    // Desactivar botón mientras se verifica
    btnLogin.disabled = true;
    btnLogin.textContent = "🔄 Verificando...";

    try {
      // Enviar solicitud al backend
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Login exitoso. Usuario: ${usuario}, Rol: ${data.rol}`);

        // Redirigir según el rol recibido
        const rutas = {
          admin: "admin.html"
        };

        if (rutas[data.rol]) {
          console.log(`🚀 Redirigiendo a ${rutas[data.rol]}`);
          window.location.href = rutas[data.rol];
        } else {
          errorDisplay.textContent = "⚠️ No tienes permisos suficientes.";
          console.warn("⚠️ Rol sin acceso permitido:", data.rol);
        }

      } else if (res.status === 401) {
        errorDisplay.textContent = "❌ Usuario o contraseña incorrectos.";
        console.warn("🔒 Credenciales inválidas (401).");
      } else {
        errorDisplay.textContent = "⚠️ Error en el servidor. Intenta más tarde.";
        console.warn("⚠️ Error HTTP:", res.status);
      }

    } catch (error) {
      // Manejo de errores de red o fetch
      errorDisplay.textContent = "❌ Error de conexión con el servidor.";
      console.error("❌ Error de red al intentar login:", error);

    } finally {
      // Restaurar el botón
      btnLogin.disabled = false;
      btnLogin.textContent = "Ingresar";
    }
  });
});
