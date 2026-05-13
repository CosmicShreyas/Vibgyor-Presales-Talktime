import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem('theme');
    const prefersDark =
      saved != null
        ? saved === 'dark'
        : typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDark.set(prefersDark);

    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update((value) => !value);
  }
}
