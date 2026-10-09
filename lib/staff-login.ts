// Team members sign in with a username. Supabase Auth needs an e-mail, so the
// server maps "ana.silva" to an internal address that never receives mail.
export const LOGIN_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export function normalizeLogin(value: string) {
  return value.trim().toLowerCase();
}

export function loginError(value: string): string | null {
  return LOGIN_PATTERN.test(normalizeLogin(value))
    ? null
    : "Use de 3 a 32 letras minúsculas, números, ponto, hífen ou sublinhado, começando por letra ou número.";
}

export function passwordError(value: string): string | null {
  return value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX
    ? null
    : `Use uma senha com ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres.`;
}

/** Suggests a username from a professional's name, e.g. "Marina Alves" → "marina.alves". */
export function suggestLogin(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 32)
    .replace(/\.+$/, "");
}
