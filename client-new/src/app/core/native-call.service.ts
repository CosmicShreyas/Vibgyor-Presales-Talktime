import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Client } from '../models';

export type NativeDialerKind = 'windows-phone-link' | 'linux-kdeconnect' | 'linux-gsconnect' | 'generic-tel';

export interface ActiveCallSession {
  id: string;
  clientId: string;
  leadName: string;
  phoneNumber: string;
  dialer: NativeDialerKind;
  startedAt: number;
}

const SESSION_STORAGE_KEY = 'talktime.activeNativeCall';

@Injectable({ providedIn: 'root' })
export class NativeCallService implements OnDestroy {
  private readonly http = inject(HttpClient);

  readonly activeSession = signal<ActiveCallSession | null>(null);
  readonly elapsedSeconds = signal(0);
  readonly logging = signal(false);
  readonly lastError = signal<string | null>(null);

  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && this.activeSession()) {
      this.syncElapsed();
    }
  };

  constructor() {
    this.restoreSession();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('focus', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('focus', this.onVisibilityChange);
    this.stopTimer();
  }

  resolveDialer(): NativeDialerKind {
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform?.toLowerCase() || '';

    if (ua.includes('win') || platform.includes('win')) {
      return 'windows-phone-link';
    }

    if (ua.includes('linux') || platform.includes('linux')) {
      if (ua.includes('gnome') || ua.includes('gsconnect')) {
        return 'linux-gsconnect';
      }
      return 'linux-kdeconnect';
    }

    return 'generic-tel';
  }

  dialerLabel(kind: NativeDialerKind): string {
    switch (kind) {
      case 'windows-phone-link':
        return 'Windows Phone Link';
      case 'linux-kdeconnect':
        return 'KDE Connect';
      case 'linux-gsconnect':
        return 'GSConnect';
      default:
        return 'System phone app';
    }
  }

  dialerHint(kind: NativeDialerKind): string {
    switch (kind) {
      case 'windows-phone-link':
        return 'Set Phone Link as the default app for tel links so calls route through your paired phone.';
      case 'linux-kdeconnect':
        return 'Install KDE Connect on this PC and your phone, pair over Bluetooth, and enable the phone handler plugin.';
      case 'linux-gsconnect':
        return 'Use GSConnect with a paired phone so tel links open on your mobile dialer.';
      default:
        return 'Your system will open the default phone handler for this number.';
    }
  }

  normalizePhoneNumber(phone: string): string {
    const trimmed = phone.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('+')) {
      return `+${trimmed.slice(1).replace(/\D/g, '')}`;
    }
    return trimmed.replace(/\D/g, '');
  }

  startCall(client: Client): boolean {
    const phoneNumber = this.normalizePhoneNumber(client.phone || '');
    if (!phoneNumber) {
      this.lastError.set('This lead does not have a phone number.');
      return false;
    }

    const session: ActiveCallSession = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      clientId: client._id,
      leadName: client.name || 'Unnamed Lead',
      phoneNumber,
      dialer: this.resolveDialer(),
      startedAt: Date.now(),
    };

    this.activeSession.set(session);
    this.elapsedSeconds.set(0);
    this.lastError.set(null);
    this.persistSession(session);
    this.startTimer();
    this.launchNativeDialer(phoneNumber);
    return true;
  }

  async completeCall(status = 'follow-up', notes = ''): Promise<boolean> {
    const session = this.activeSession();
    if (!session) return false;

    this.logging.set(true);
    this.lastError.set(null);
    this.syncElapsed();

    try {
      await firstValueFrom(
        this.http.post('/api/calls', {
          clientId: session.clientId,
          status,
          notes: notes.trim(),
          callDuration: this.elapsedSeconds(),
          phoneNumber: session.phoneNumber,
          dialer: session.dialer,
        }),
      );
      this.clearSession();
      return true;
    } catch (err: unknown) {
      const message =
        (err as { error?: { message?: string } })?.error?.message || 'Unable to save this call right now.';
      this.lastError.set(message);
      return false;
    } finally {
      this.logging.set(false);
    }
  }

  cancelCall(): void {
    this.clearSession();
  }

  formatElapsed(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  }

  private launchNativeDialer(phoneNumber: string): void {
    const uri = `tel:${encodeURIComponent(phoneNumber)}`;
    const link = document.createElement('a');
    link.href = uri;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  private restoreSession(): void {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return;

    try {
      const session = JSON.parse(raw) as ActiveCallSession;
      if (!session?.clientId || !session.startedAt) return;
      this.activeSession.set(session);
      this.syncElapsed();
      this.startTimer();
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private persistSession(session: ActiveCallSession): void {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private clearSession(): void {
    this.stopTimer();
    this.activeSession.set(null);
    this.elapsedSeconds.set(0);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  private startTimer(): void {
    this.stopTimer();
    this.syncElapsed();
    this.timerId = setInterval(() => this.syncElapsed(), 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private syncElapsed(): void {
    const session = this.activeSession();
    if (!session) return;
    this.elapsedSeconds.set(Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000)));
  }
}
