import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BrandPartner } from '../models';
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  getStoredBrandPartner,
  setStoredAuthToken,
  setStoredBrandPartner,
} from './auth-token.storage';

function isExpired(token: string): boolean {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    return typeof exp === 'number' && Date.now() >= exp * 1000;
  } catch {
    return false;
  }
}

function msUntilExpiry(token: string): number | null {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 - Date.now() : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(null);
  private readonly brandPartnerSignal = signal<BrandPartner | null>(null);
  readonly token = this.tokenSignal.asReadonly();
  readonly brandPartner = this.brandPartnerSignal.asReadonly();
  readonly ready = signal(false);

  private restoreSessionPromise: Promise<void> | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly http: HttpClient) {}

  initFromStorage(): Promise<void> {
    if (this.restoreSessionPromise) return this.restoreSessionPromise;
    this.restoreSessionPromise = this.runSessionRestore();
    return this.restoreSessionPromise;
  }

  private async runSessionRestore(): Promise<void> {
    const stored = getStoredAuthToken();
    if (!stored || isExpired(stored)) {
      clearStoredAuthToken();
      this.tokenSignal.set(null);
      this.brandPartnerSignal.set(null);
      this.ready.set(true);
      return;
    }

    this.tokenSignal.set(stored);
    this.brandPartnerSignal.set(getStoredBrandPartner<BrandPartner>());
    this.scheduleExpiryLogout(stored);
    this.ready.set(true);
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.post<{ token: string; brandPartner: BrandPartner; message?: string }>(
          '/api/brand-partners/login',
          { email, password },
        ),
      );

      if (!data.token) {
        throw new Error(data.message ?? 'Invalid email or password');
      }

      setStoredAuthToken(data.token);
      setStoredBrandPartner(data.brandPartner);
      this.tokenSignal.set(data.token);
      this.brandPartnerSignal.set(data.brandPartner);
      this.scheduleExpiryLogout(data.token);
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        const message = (error.error as { message?: string } | null)?.message;
        throw new Error(message ?? 'Invalid email or password');
      }
      throw error;
    }
  }

  logout(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    clearStoredAuthToken();
    this.tokenSignal.set(null);
    this.brandPartnerSignal.set(null);
    this.restoreSessionPromise = null;
    this.ready.set(true);
  }

  isAuthenticated(): boolean {
    const token = this.tokenSignal() ?? getStoredAuthToken();
    return !!token && !isExpired(token);
  }

  private scheduleExpiryLogout(token: string): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }

    const ms = msUntilExpiry(token);
    if (ms === null) return;
    if (ms <= 0) {
      this.logout();
      return;
    }
    if (ms > 2_147_483_647) return;

    this.expiryTimer = setTimeout(() => this.logout(), ms);
  }
}
