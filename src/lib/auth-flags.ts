/**
 * Flag sincrónico para indicar que el usuario está cerrando sesión voluntariamente.
 * Usa isSigningOut() para leer (sin consumir) y clearSigningOut() para resetear.
 * Compatible con React Strict Mode (no consume en render, solo en efecto).
 */
let _isSigningOut = false;

export const markSigningOut = (): void => {
  _isSigningOut = true;
};

/** Lee el flag sin consumirlo (seguro en renders múltiples de Strict Mode). */
export const isSigningOut = (): boolean => _isSigningOut;

/** Resetea el flag una vez que el componente destino ya montó. */
export const clearSigningOut = (): void => {
  _isSigningOut = false;
};
