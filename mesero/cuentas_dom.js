// cuentas_dom.js

export function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = texto;
  mensaje.className = tipo === "error"
    ? "bg-red-100 text-red-800 p-2 rounded"
    : "bg-green-100 text-green-800 p-2 rounded";
  mensaje.classList.remove("hidden");
  mensaje.setAttribute("aria-live", "assertive");

  setTimeout(() => mensaje.classList.add("hidden"), 4000);
}

export function renderizarListaCuentas(cuentas, onSeleccionar) {
  const contenedor = document.getElementById("listaCuentas");
  contenedor.innerHTML = "";

  if (!cuentas || cuentas.length === 0) {
    contenedor.innerHTML = "<p class='text-gray-600'>No hay cuentas abiertas.</p>";
    return;
  }

  cuentas.forEach(c => {
    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded shadow mb-2 cursor-pointer hover:bg-gray-100";
    div.innerHTML = `
      <h3 class="font-bold">🪑 Mesa ${c.mesa}</h3>
      <p class="text-sm text-gray-500">Cuenta: ${c.cuenta}</p>
      <p class="text-sm text-gray-500">Mesero: ${c.mesero}</p>`;
    div.addEventListener("click", () => onSeleccionar(c.id));
    contenedor.appendChild(div);
  });
}

export function mostrarDetalleCuenta(datosCuenta) {
  const contenedor = document.getElementById("detalleCuenta");
  contenedor.innerHTML = "";
  let total = 0;

  datosCuenta.forEach(item => {
    const div = document.createElement("div");
    div.className = "border-b py-2";
    div.innerHTML = `
      <p>${item.cantidad} × ${item.producto}${item.nombre ? ` (para ${item.nombre})` : ""}</p>`;
    contenedor.appendChild(div);
    total += item.cantidad * item.precio;
  });

  document.getElementById("totalGeneral").textContent = total.toFixed(2);
  document.getElementById("propina").value = "";

  document.getElementById("seccionDetalle").classList.remove("hidden");
  document.getElementById("seccionLista").classList.add("hidden");
}

export function volverALista() {
  document.getElementById("seccionDetalle").classList.add("hidden");
  document.getElementById("seccionLista").classList.remove("hidden");
}
