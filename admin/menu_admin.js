/**
 * 🍽️ Sistema de Menú para Clientes
 * Carga y muestra los productos disponibles desde la base de datos
 */

let productosMenu = []; // Array para almacenar los productos
let carrito = []; // Array para el carrito de compras

/**
 * 📋 Carga los productos del menú desde el backend
 */
async function cargarMenu() {
  console.log("🍽️ Cargando menú de productos...");
  
  try {
    const res = await fetch("http://localhost:5000/api/productos", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      console.warn("⚠️ Error al cargar el menú. Código:", res.status);
      mostrarMensajeError("No se pudo cargar el menú en este momento.");
      return;
    }

    const productos = await res.json();
    productosMenu = productos;
    
    console.log(`✅ ${productos.length} producto(s) cargado(s) del menú.`);
    mostrarProductos(productos);
    
  } catch (error) {
    console.error("❌ Error de conexión al cargar el menú:", error);
    mostrarMensajeError("Error de conexión. Verifica tu conexión a internet.");
  }
}

/**
 * 🎨 Muestra los productos en la página
 * @param {Array} productos - Lista de productos a mostrar
 */
function mostrarProductos(productos) {
  const contenedorMenu = document.getElementById("menuProductos");
  
  if (!contenedorMenu) {
    console.error("❌ No se encontró el contenedor del menú");
    return;
  }

  // Limpiar contenedor
  contenedorMenu.innerHTML = "";

  if (!productos || productos.length === 0) {
    contenedorMenu.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500 text-lg">😔 No hay productos disponibles en este momento.</p>
        <button onclick="cargarMenu()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          🔄 Recargar Menú
        </button>
      </div>`;
    return;
  }

  // Crear tarjetas de productos
  productos.forEach((producto, index) => {
    const tarjetaProducto = `
      <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        <div class="mb-3">
          <h3 class="text-lg font-bold text-gray-800">${producto.nombre}</h3>
          <p class="text-2xl font-bold text-green-600">$${producto.precio.toFixed(2)}</p>
        </div>
        <div class="flex gap-2">
          <button 
            onclick="agregarAlCarrito('${producto.nombre}', ${producto.precio})" 
            class="flex-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors">
            🛒 Agregar
          </button>
          <button 
            onclick="verDetalles('${producto.nombre}', ${producto.precio})" 
            class="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors">
            👁️ Ver
          </button>
        </div>
      </div>`;
    
    contenedorMenu.innerHTML += tarjetaProducto;
  });
}

/**
 * 🛒 Agrega un producto al carrito
 * @param {string} nombre - Nombre del producto
 * @param {number} precio - Precio del producto
 */
function agregarAlCarrito(nombre, precio) {
  // Buscar si el producto ya está en el carrito
  const productoExistente = carrito.find(item => item.nombre === nombre);
  
  if (productoExistente) {
    productoExistente.cantidad += 1;
    console.log(`➕ Cantidad aumentada de "${nombre}" en el carrito`);
  } else {
    carrito.push({
      nombre: nombre,
      precio: precio,
      cantidad: 1
    });
    console.log(`🛒 "${nombre}" agregado al carrito`);
  }
  
  actualizarContadorCarrito();
  mostrarNotificacion(`✅ "${nombre}" agregado al carrito`);
}

/**
 * 👁️ Muestra los detalles de un producto
 * @param {string} nombre - Nombre del producto
 * @param {number} precio - Precio del producto
 */
function verDetalles(nombre, precio) {
  alert(`🍽️ Producto: ${nombre}\n💰 Precio: $${precio.toFixed(2)}\n\n¡Disponible para ordenar!`);
}

/**
 * 🔢 Actualiza el contador del carrito
 */
function actualizarContadorCarrito() {
  const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
  const contadorCarrito = document.getElementById("contadorCarrito");
  
  if (contadorCarrito) {
    contadorCarrito.textContent = totalItems;
    contadorCarrito.style.display = totalItems > 0 ? "inline" : "none";
  }
}

/**
 * 🛒 Muestra el contenido del carrito
 */
function mostrarCarrito() {
  if (carrito.length === 0) {
    alert("🛒 Tu carrito está vacío");
    return;
  }

  let contenidoCarrito = "🛒 Tu Carrito:\n\n";
  let total = 0;

  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    contenidoCarrito += `• ${item.nombre}\n`;
    contenidoCarrito += `  Cantidad: ${item.cantidad}\n`;
    contenidoCarrito += `  Precio: $${item.precio.toFixed(2)} c/u\n`;
    contenidoCarrito += `  Subtotal: $${subtotal.toFixed(2)}\n\n`;
    total += subtotal;
  });

  contenidoCarrito += `💰 TOTAL: $${total.toFixed(2)}`;
  alert(contenidoCarrito);
}

/**
 * 🗑️ Vacía el carrito
 */
function vaciarCarrito() {
  if (carrito.length === 0) {
    alert("🛒 El carrito ya está vacío");
    return;
  }

  const confirmar = confirm("🗑️ ¿Seguro que quieres vaciar el carrito?");
  if (confirmar) {
    carrito = [];
    actualizarContadorCarrito();
    console.log("🗑️ Carrito vaciado");
    mostrarNotificacion("🗑️ Carrito vaciado");
  }
}

/**
 * 🔍 Busca productos por nombre
 * @param {string} termino - Término de búsqueda
 */
function buscarProductos(termino) {
  if (!termino.trim()) {
    mostrarProductos(productosMenu);
    return;
  }

  const productosFiltrados = productosMenu.filter(producto => 
    producto.nombre.toLowerCase().includes(termino.toLowerCase())
  );

  console.log(`🔍 Búsqueda: "${termino}" - ${productosFiltrados.length} resultado(s)`);
  mostrarProductos(productosFiltrados);
}

/**
 * ⚠️ Muestra mensaje de error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarMensajeError(mensaje) {
  const contenedorMenu = document.getElementById("menuProductos");
  if (contenedorMenu) {
    contenedorMenu.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-red-500 text-lg">❌ ${mensaje}</p>
        <button onclick="cargarMenu()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          🔄 Intentar de Nuevo
        </button>
      </div>`;
  }
}

/**
 * 📢 Muestra notificación temporal
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarNotificacion(mensaje) {
  // Crear elemento de notificación
  const notificacion = document.createElement("div");
  notificacion.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50";
  notificacion.textContent = mensaje;
  
  document.body.appendChild(notificacion);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    if (notificacion.parentNode) {
      notificacion.parentNode.removeChild(notificacion);
    }
  }, 3000);
}

/**
 * 🎯 Configurar buscador en tiempo real
 */
function configurarBuscador() {
  const campoBusqueda = document.getElementById("busquedaMenu");
  if (campoBusqueda) {
    let timeoutBusqueda;
    
    campoBusqueda.addEventListener("input", function(e) {
      clearTimeout(timeoutBusqueda);
      timeoutBusqueda = setTimeout(() => {
        buscarProductos(e.target.value);
      }, 300); // Esperar 300ms después de que el usuario deje de escribir
    });
  }
}

// 🚀 Inicialización cuando se carga la página
document.addEventListener("DOMContentLoaded", function() {
  console.log("🍽️ Inicializando sistema de menú...");
  cargarMenu();
  configurarBuscador();
  actualizarContadorCarrito();
});

// 🔄 Recargar menú cada 5 minutos para obtener productos nuevos
setInterval(() => {
  console.log("🔄 Recarga automática del menú...");
  cargarMenu();
}, 300000); // 5 minutos