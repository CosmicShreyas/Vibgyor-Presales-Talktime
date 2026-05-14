/** Same key as the legacy React client — DevTools → Local Storage → `token`. */
export const AUTH_TOKEN_STORAGE_KEY = 'token';

export function getStoredAuthToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const t = raw.trim();
    return t.length ? t : null;
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string): void {
  const t = token.trim();
  if (!t) return;
  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, t);
  } catch {
    /* quota / private mode */
  }
}

export function clearStoredAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
