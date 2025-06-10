
document.addEventListener("DOMContentLoaded", () => {
  const listaCuentas = document.getElementById("listaCuentas");
  const detalleCuenta = document.getElementById("detalleCuenta");
  const totalGeneral = document.getElementById("totalGeneral");
  const propinaInput = document.getElementById("propina");
  const cerrarCuentaBtn = document.getElementById("cerrarCuentaBtn");
  const mensaje = document.getElementById("mensaje");
  const volverBtn = document.getElementById("volverBtn");

  let cuentaSeleccionada = null;
  let datosCuenta = [];

  function mostrarMensaje(texto, tipo = "info") {
    mensaje.textContent = texto;
    mensaje.className = tipo === "error" ? "bg-red-100 text-red-800 p-2 rounded" : "bg-green-100 text-green-800 p-2 rounded";
    mensaje.setAttribute("aria-live", "assertive");
    mensaje.classList.remove("hidden");
    setTimeout(() => mensaje.classList.add("hidden"), 4000);
  }

  function cargarCuentas() {
    fetch("http://localhost:5000/api/cuentas-abiertas", { credentials: "include" })
      .then(res => res.json())
      .then(cuentas => {
        listaCuentas.innerHTML = "";
        if (cuentas.length === 0) {
          listaCuentas.innerHTML = "<p class='text-gray-600'>No hay cuentas abiertas.</p>";
          return;
        }

        cuentas.forEach(c => {
          const div = document.createElement("div");
          div.className = "bg-white p-4 rounded shadow mb-2 cursor-pointer hover:bg-gray-100";
          div.innerHTML = `
            <h3 class="font-bold">🪑 Mesa ${c.mesa}</h3>
            <p class="text-sm text-gray-500">Cuenta: ${c.cuenta}</p>
            <p class="text-sm text-gray-500">Mesero: ${c.mesero}</p>
          `;
          div.addEventListener("click", () => seleccionarCuenta(c.id));
          listaCuentas.appendChild(div);
        });
      })
      .catch(err => {
        console.error("❌ Error al cargar cuentas:", err);
        mostrarMensaje("Error al cargar cuentas abiertas.", "error");
      });
  }

  function seleccionarCuenta(id) {
    fetch(`http://localhost:5000/api/detalle-cuenta/${id}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        cuentaSeleccionada = id;
        datosCuenta = data;
        mostrarDetalleCuenta();
      })
      .catch(err => {
        console.error("❌ Error al obtener detalle:", err);
        mostrarMensaje("Error al obtener detalle de la cuenta.", "error");
      });
  }

  function mostrarDetalleCuenta() {
    detalleCuenta.innerHTML = "";
    let total = 0;

    datosCuenta.forEach(item => {
      const div = document.createElement("div");
      div.className = "border-b py-2";
      div.innerHTML = `
        <p>${item.cantidad} × ${item.producto}${item.nombre ? ` (para ${item.nombre})` : ""}</p>
      `;
      detalleCuenta.appendChild(div);
      total += item.cantidad * item.precio;
    });

    totalGeneral.textContent = total.toFixed(2);
    propinaInput.value = "";
    document.getElementById("seccionDetalle").classList.remove("hidden");
    document.getElementById("seccionLista").classList.add("hidden");
  }

  cerrarCuentaBtn.addEventListener("click", () => {
    if (!cuentaSeleccionada) {
      mostrarMensaje("⚠️ No hay cuenta seleccionada.", "error");
      return;
    }

    const propina = parseFloat(propinaInput.value) || 0;
    if (propina < 0) {
      mostrarMensaje("⚠️ La propina no puede ser negativa.", "error");
      return;
    }

    const confirmar = confirm("¿Estás seguro de cerrar esta cuenta?");
    if (!confirmar) return;

    const payload = {
      cuenta_id: cuentaSeleccionada,
      propina
    };

    fetch("http://localhost:5000/api/cerrar-cuenta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error("Error al cerrar cuenta");
        return res.json();
      })
      .then(data => {
        mostrarMensaje("✅ Cuenta cerrada correctamente.");
        cuentaSeleccionada = null;
        document.getElementById("seccionDetalle").classList.add("hidden");
        document.getElementById("seccionLista").classList.remove("hidden");
        cargarCuentas();
      })
      .catch(err => {
        console.error("❌ Error al cerrar cuenta:", err);
        mostrarMensaje("Error al cerrar la cuenta.", "error");
      });
  });

  volverBtn.addEventListener("click", () => {
    cuentaSeleccionada = null;
    document.getElementById("seccionDetalle").classList.add("hidden");
    document.getElementById("seccionLista").classList.remove("hidden");
  });

  cargarCuentas();
});
