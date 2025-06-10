// mesero_validacion.js

let intentosFallidos = 0;
let bloqueoActivo = false;

export function validarCampos(usuario, password) {
  if (!usuario || !password) {
    return "⚠️ Debes completar todos los campos.";
  }
  return null;
}

export function puedeIntentarLogin() {
  return !bloqueoActivo;
}

export function registrarFallo(onBloqueoActivado) {
  intentosFallidos++;
  if (intentosFallidos >= 3) {
    bloqueoActivo = true;
    console.warn("🔒 Se activó el bloqueo temporal.");
    setTimeout(() => {
      bloqueoActivo = false;
      intentosFallidos = 0;
      console.log("🔓 Bloqueo levantado.");
    }, 5000);
    onBloqueoActivado?.();
  }
}
