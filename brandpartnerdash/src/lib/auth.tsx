import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const TOKEN_KEY = "brandPartnerToken";
export const API_BASE = import.meta.env.VITE_API_BASE as string;

export interface BrandPartner {
  _id: string;
  name: string;
  email: string;
  businessName: string;
  primaryPhone: string;
  isActive: boolean;
}

interface AuthContextValue {
  token: string | null;
  brandPartner: BrandPartner | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

function isExpired(token: string): boolean {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return typeof exp === "number" && Date.now() >= exp * 1000;
  } catch {
    return false;
  }
}

function msUntilExpiry(token: string): number | null {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return typeof exp === "number" ? exp * 1000 - Date.now() : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [brandPartner, setBrandPartner] = useState<BrandPartner | null>(null);
  const [ready, setReady] = useState(false);

  // Client-only: read localStorage after hydration
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && !isExpired(stored)) {
      setToken(stored);
      try {
        setBrandPartner(JSON.parse(localStorage.getItem("brandPartnerData") ?? "null"));
      } catch { /* ignore */ }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("brandPartnerData");
    }
    setReady(true);
  }, []);

  // Auto-logout on expiry (only schedule if within setTimeout's safe range ~24 days)
  useEffect(() => {
    if (!token) return;
    const ms = msUntilExpiry(token);
    if (ms === null) return;
    if (ms <= 0) { doLogout(); return; }
    // setTimeout max is 2^31-1 ms (~24.8 days); skip scheduling for longer tokens
    if (ms > 2_147_483_647) return;
    const id = setTimeout(doLogout, ms);
    return () => clearTimeout(id);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/brand-partners/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? "Invalid email or password");
    }
    const data = await res.json() as { token: string; brandPartner: BrandPartner };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem("brandPartnerData", JSON.stringify(data.brandPartner));
    setToken(data.token);
    setBrandPartner(data.brandPartner);
  }

  function doLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("brandPartnerData");
    setToken(null);
    setBrandPartner(null);
  }

  return (
    <AuthContext.Provider value={{ token, brandPartner, ready, login, logout: doLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Used in beforeLoad — reads localStorage directly (browser only). */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  return !!token && !isExpired(token);
}
