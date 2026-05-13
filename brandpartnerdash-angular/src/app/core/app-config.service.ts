import { Injectable, isDevMode, signal } from '@angular/core';

export interface AppConfigJson {
  apiUrlDevelopment?: string;
  apiUrlProduction?: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly apiBaseUrlSignal = signal('');

  readonly apiBaseUrl = this.apiBaseUrlSignal.asReadonly();

  async load(): Promise<void> {
    try {
      const href = new URL('app-config.json', document.baseURI).href;
      const response = await fetch(href, { cache: 'no-store' });
      if (!response.ok) throw new Error(String(response.status));
      const config = (await response.json()) as AppConfigJson;
      const raw = (isDevMode() ? config.apiUrlDevelopment : config.apiUrlProduction) ?? '';
      this.apiBaseUrlSignal.set(String(raw).trim().replace(/\/$/, ''));
    } catch {
      this.apiBaseUrlSignal.set('');
    }
  }
}
