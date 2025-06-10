// autenticacion_admin.js
export async function autenticarAdmin(username, password) {
  try {
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Login exitoso. Usuario: ${username}, Rol: ${data.rol}`);
      return { success: true, data };
    } else if (res.status === 401) {
      console.warn("🔒 Credenciales inválidas (401).");
      return { success: false, error: "❌ Usuario o contraseña incorrectos." };
    } else {
      console.warn("⚠️ Error HTTP:", res.status);
      return { success: false, error: "⚠️ Error en el servidor. Intenta más tarde." };
    }
  } catch (error) {
    console.error("❌ Error de red al intentar login:", error);
    return { success: false, error: "❌ Error de conexión con el servidor." };
  }
}
