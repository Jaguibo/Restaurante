// menu_datos.js
export let productosMenu = [];

export async function cargarMenu() {
  console.log("🍽️ Cargando menú de productos...");

  try {
    const res = await fetch("http://localhost:5000/api/productos", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      console.warn("⚠️ Error al cargar el menú. Código:", res.status);
      return { error: "No se pudo cargar el menú en este momento." };
    }

    const productos = await res.json();
    productosMenu = productos;
    console.log(`✅ ${productos.length} producto(s) cargado(s) del menú.`);
    return { productos };
  } catch (error) {
    console.error("❌ Error de conexión al cargar el menú:", error);
    return { error: "Error de conexión. Verifica tu conexión a internet." };
  }
}
