import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
interface CallRecord {
  _id: string;
  status: string;
  notes?: string;
  callDuration?: number;
  timestamp: string;
  callbackDate?: string;
  clientId?: { name?: string; company?: string; phone?: string; email?: string };
}

@Component({
  selector: 'app-call-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './call-history.component.html',
})
export class CallHistoryComponent {
  private readonly http = inject(HttpClient);
  readonly callHistory = signal<CallRecord[]>([]);
  readonly callStats = signal<Record<string, number | string | unknown>>({});
  readonly loading = signal(true);
  readonly searchQuery = signal('');
  readonly statusFilter = signal('all');
  readonly currentPage = signal(1);
  readonly selectedCall = signal<CallRecord | null>(null);
  readonly recordsPerPage = 20;

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [hist, basic, detailed] = await Promise.all([
        firstValueFrom(this.http.get<CallRecord[]>('/api/calls/history')),
        firstValueFrom(this.http.get<Record<string, unknown>>('/api/calls/stats')),
        firstValueFrom(this.http.get<Record<string, unknown>>('/api/calls/stats/detailed')),
      ]);
      this.callHistory.set(hist);
      this.callStats.set({ ...basic, ...detailed });
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  filteredCalls(): CallRecord[] {
    const q = this.searchQuery().toLowerCase();
    return this.callHistory().filter((call) => {
      const leadName = call.clientId?.name || 'Deleted Lead';
      const company = call.clientId?.company || '';
      const phone = call.clientId?.phone || '';
      const notes = call.notes || '';
      const matchSearch =
        !q ||
        leadName.toLowerCase().includes(q) ||
        company.toLowerCase().includes(q) ||
        phone.includes(this.searchQuery()) ||
        notes.toLowerCase().includes(q);
      const matchStatus = this.statusFilter() === 'all' || call.status === this.statusFilter();
      return matchSearch && matchStatus;
    });
  }

  uniqueStatuses(): string[] {
    return [...new Set(this.callHistory().map((c) => c.status))];
  }

  paginated(): CallRecord[] {
    const f = this.filteredCalls();
    const start = (this.currentPage() - 1) * this.recordsPerPage;
    return f.slice(start, start + this.recordsPerPage);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCalls().length / this.recordsPerPage));
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      qualified: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'not-interested': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'follow-up': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'no-response': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'number-inactive': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'number-switched-off': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'on-hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'no-requirement': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      disqualified: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      disconnected: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'already-finalised': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }

  formatDuration(seconds?: number): string {
    if (!seconds || seconds === 0) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatStatus(status: string): string {
    return status.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  statNum(key: string): number {
    const v = this.callStats()[key];
    return typeof v === 'number' ? v : 0;
  }

  callFrequency(): { leadName?: string; company?: string; phone?: string; callCount?: number; lastCallDate?: string }[] {
    const cf = this.callStats()['callFrequency'];
    return Array.isArray(cf) ? (cf as []) : [];
  }

  prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }
}
