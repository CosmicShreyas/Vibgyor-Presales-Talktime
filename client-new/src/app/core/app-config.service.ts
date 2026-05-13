import { Injectable, isDevMode, signal } from '@angular/core';

export interface AppConfigJson {
  apiUrlDevelopment?: string;
  apiUrlProduction?: string;
}

/**
 * Loads `app-config.json` from the site root (served from `public/app-config.json`).
 * Edit that file to set API bases; no rebuild needed when values change (refresh the browser).
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly _apiBaseUrl = signal('');

  /** Resolved base URL (no trailing slash). Empty = use relative URLs (e.g. `/api/...` + dev proxy). */
  readonly apiBaseUrl = this._apiBaseUrl.asReadonly();

  async load(): Promise<void> {
    try {
      const href = new URL('app-config.json', document.baseURI).href;
      const res = await fetch(href, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const cfg = (await res.json()) as AppConfigJson;
      const raw = (isDevMode() ? cfg.apiUrlDevelopment : cfg.apiUrlProduction) ?? '';
      this._apiBaseUrl.set(String(raw).trim().replace(/\/$/, ''));
    } catch {
      this._apiBaseUrl.set('');
    }
  }
}
