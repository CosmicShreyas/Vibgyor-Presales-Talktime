const TOKEN_KEY = 'brandPartnerToken';
const PARTNER_KEY = 'brandPartnerData';

export function getStoredAuthToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PARTNER_KEY);
}

export function getStoredBrandPartner<T>(): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(PARTNER_KEY) ?? 'null') as T;
  } catch {
    return null;
  }
}

export function setStoredBrandPartner<T>(partner: T): void {
  localStorage.setItem(PARTNER_KEY, JSON.stringify(partner));
}
