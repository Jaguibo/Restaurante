// mesero_autenticacion.js

export async function autenticarMesero(usuario, password) {
  try {
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: usuario, password }),
    });

    if (!res.ok) return { status: res.status };

    const data = await res.json();
    return { status: res.status, data };
  } catch (err) {
    console.error("❌ Error de red o del servidor:", err);
    return { error: true };
  }
}
