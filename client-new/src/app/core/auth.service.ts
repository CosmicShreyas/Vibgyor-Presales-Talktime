import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthUser } from '../models';
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from './auth-token.storage';
import { extractTokenFromLoginResponse, extractUserFromLoginResponse } from './auth-login-response.util';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<AuthUser | null>(null);
  readonly user = this.userSignal.asReadonly();
  /** True until the first `initFromStorage()` run has finished (success or not). */
  readonly loading = signal(true);

  /** Single flight: bootstrap + route guards all await the same restore. */
  private restoreSessionPromise: Promise<void> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  /**
   * Restores the session from `localStorage` JWT and `/api/auth/me`.
   * Safe to call from `APP_INITIALIZER` and from route guards; runs at most once until `logout()`.
   */
  initFromStorage(): Promise<void> {
    if (this.restoreSessionPromise) return this.restoreSessionPromise;
    this.restoreSessionPromise = this.runSessionRestore();
    return this.restoreSessionPromise;
  }

  private async runSessionRestore(): Promise<void> {
    await this.appConfig.load();

    const token = getStoredAuthToken();
    if (!token) {
      this.userSignal.set(null);
      this.loading.set(false);
      return;
    }
    try {
      const u = await firstValueFrom(this.http.get<AuthUser>('/api/auth/me'));
      this.userSignal.set(this.normalizeUser(u));
    } catch {
      clearStoredAuthToken();
      this.userSignal.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private normalizeUser(u: AuthUser & { _id?: string }): AuthUser {
    const id = u.id || (u as { _id?: string })._id || '';
    return { ...u, id };
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await firstValueFrom(this.http.post<unknown>('/api/auth/login', { email, password }));
      const token = extractTokenFromLoginResponse(res);
      if (!token) {
        return { success: false, message: 'Login response did not include a token' };
      }
      setStoredAuthToken(token);

      const embedded = extractUserFromLoginResponse(res);
      if (embedded) {
        this.userSignal.set(this.normalizeUser(embedded));
      } else {
        const u = await firstValueFrom(this.http.get<AuthUser>('/api/auth/me'));
        this.userSignal.set(this.normalizeUser(u));
      }
      return { success: true };
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      return { success: false, message: err.error?.message || 'Login failed' };
    }
  }

  logout(): void {
    clearStoredAuthToken();
    this.userSignal.set(null);
    this.restoreSessionPromise = null;
    this.loading.set(false);
  }

  isAdmin(): boolean {
    return this.userSignal()?.role === 'admin';
  }
}
