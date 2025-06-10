document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form#formulario");
  const error = document.getElementById("error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre")?.value.trim();

    // 🧪 Validación
    if (!nombre) {
      error.textContent = "❌ Por favor, escribe tu nombre.";
      console.warn("[LOGIN] Nombre vacío.");
      return;
    }

    const payload = {
      usuario: nombre,
      rol: "mesero"
    };

    console.log(`[LOGIN] Intentando iniciar sesión como: ${nombre}`);
    console.log(`[LOGIN] Fecha/Hora: ${new Date().toLocaleString()}`);

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // Incluye cookies
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.warn(`[LOGIN] Fallo de autenticación. Código: ${res.status}`);
        error.textContent = "❌ Usuario no reconocido.";
        return;
      }

      const data = await res.json();
      console.log("✅ Sesión iniciada con éxito:", data);

      // 🔄 Guardar sesión local (opcional)
      localStorage.setItem("usuario", nombre);
      localStorage.setItem("inicioTurno", new Date().toISOString());

      // Redirigir a la app
      window.location.href = "pedidos.html";

    } catch (err) {
      console.error("❌ Error de red al iniciar sesión:", err);
      error.textContent = "❌ No se pudo iniciar sesión. Verifica conexión.";
    }
  });
});
