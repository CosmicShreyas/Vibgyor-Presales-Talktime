import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  private readonly http = inject(HttpClient);
  emailConfig = { email: '', appPassword: '', senderName: '' };
  reportSchedule = { daily: false, weekly: false, monthly: false, recipients: '' };
  loading = false;
  message: { type: string; text: string } | null = null;

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const ec = await firstValueFrom(this.http.get<{ email?: string; senderName?: string } | null>('/api/reports/email-config'));
      if (ec) {
        this.emailConfig = { email: ec.email || '', appPassword: '', senderName: ec.senderName || '' };
      }
    } catch {
      /* ignore */
    }
    try {
      const sch = await firstValueFrom(
        this.http.get<{ daily: boolean; weekly: boolean; monthly: boolean; recipients: string } | null>('/api/reports/schedule'),
      );
      if (sch) this.reportSchedule = { ...sch };
    } catch {
      /* ignore */
    }
  }

  async saveEmail(e: Event): Promise<void> {
    e.preventDefault();
    this.loading = true;
    this.message = null;
    try {
      await firstValueFrom(this.http.post('/api/reports/email-config', this.emailConfig));
      this.message = { type: 'success', text: 'Email configuration saved successfully!' };
      this.emailConfig.appPassword = '';
    } catch (err: unknown) {
      this.message = { type: 'error', text: (err as { error?: { message?: string } })?.error?.message || 'Failed to save email configuration' };
    } finally {
      this.loading = false;
    }
  }

  async saveSchedule(e: Event): Promise<void> {
    e.preventDefault();
    this.loading = true;
    this.message = null;
    try {
      await firstValueFrom(this.http.post('/api/reports/schedule', this.reportSchedule));
      this.message = { type: 'success', text: 'Report schedule saved successfully!' };
    } catch (err: unknown) {
      this.message = { type: 'error', text: (err as { error?: { message?: string } })?.error?.message || 'Failed to save report schedule' };
    } finally {
      this.loading = false;
    }
  }

  async generate(type: string): Promise<void> {
    this.loading = true;
    this.message = null;
    try {
      await firstValueFrom(this.http.post('/api/reports/generate', { type }));
      this.message = { type: 'success', text: `${type.charAt(0).toUpperCase() + type.slice(1)} report generated and sent!` };
    } catch (err: unknown) {
      this.message = { type: 'error', text: (err as { error?: { message?: string } })?.error?.message || 'Failed to generate report' };
    } finally {
      this.loading = false;
    }
  }
}
