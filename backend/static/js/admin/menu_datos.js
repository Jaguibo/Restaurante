export let productosMenu = [];

// Clave de localStorage para persistencia offline
const LOCAL_STORAGE_KEY = "productosMenuCache";

// Asegúrate de declarar productosMenu si viene de otro módulo
import { productosMenu } from "./menu_datos.js";

export async function cargarMenu() {
  console.log("🍽️ [Menu] Iniciando carga del menú de productos...");

  const BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:5000"
    : "https://restaurante-mqgs.onrender.com";

  try {
    const res = await fetch(`${BASE_URL}/api/productos`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      console.warn(`⚠️ [Menu] Error HTTP al cargar el menú. Código: ${res.status}`);
      return usarCacheOffline("No se pudo cargar el menú desde el servidor.");
    }

    const productos = await res.json();

    if (!Array.isArray(productos)) {
      console.warn("⚠️ [Menu] Respuesta del servidor no es una lista válida.");
      return usarCacheOffline("Datos recibidos inválidos.");
    }

    productosMenu.length = 0; // Limpiar el array si ya existía
    productosMenu.push(...productos); // Copiar elementos
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(productos));
    console.log(`✅ [Menu] ${productos.length} producto(s) cargado(s) desde el servidor.`);
    return { productos };
  } catch (error) {
    console.error("❌ [Menu] Error de conexión al cargar el menú:", error);
    return usarCacheOffline("Error de conexión. Mostrando datos en caché.");
  }
}

function usarCacheOffline(mensaje) {
  const cache = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cache) {
    const productos = JSON.parse(cache);
    productosMenu.length = 0;
    productosMenu.push(...productos);
    console.warn(`📦 [Offline] Usando caché local (${productos.length} productos).`);
    alert(`⚠️ ${mensaje}`);
    return { productos };
  } else {
    console.error("📭 [Offline] No hay caché local disponible.");
    alert("❌ No hay conexión y tampoco datos en caché.");
    return { productos: [] };
  }
}


// Función auxiliar para usar los datos almacenados localmente si hay un error
function usarCacheOffline(mensaje) {
  const cache = localStorage.getItem(LOCAL_STORAGE_KEY);
  
  if (cache) {
    try {
      const productosCache = JSON.parse(cache);
      if (Array.isArray(productosCache)) {
        productosMenu = productosCache;
        console.warn(`📦 [Menu] Usando menú en caché. ${productosCache.length} producto(s) recuperado(s).`);
        return {
          productos: productosCache,
          offline: true,
          warning: mensaje
        };
      } else {
        console.error("❌ [Menu] Los datos en caché no son válidos.");
      }
    } catch (parseError) {
      console.error("❌ [Menu] Error al analizar el caché:", parseError);
    }
  }

  console.error("🚫 [Menu] No se pudo recuperar el menú ni desde el servidor ni desde el caché.");
  return {
    error: "No se pudo cargar el menú. Intenta más tarde.",
    offline: true
  };
}
