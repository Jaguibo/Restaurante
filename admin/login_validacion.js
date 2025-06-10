// validacion_login.js
export function validarCampos(usuario, password) {
  if (!usuario || !password) {
    console.warn("⚠️ Campos incompletos al intentar iniciar sesión.");
    return "⚠️ Por favor, completa todos los campos.";
  }
  return null;
}
