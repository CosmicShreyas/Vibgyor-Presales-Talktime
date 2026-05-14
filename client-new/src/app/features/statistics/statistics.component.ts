import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Client, EmployeeUser, ProjectSource } from '../../models';

type StatisticsStatusIcon =
  | 'clock'
  | 'phone-slash'
  | 'thumb-down'
  | 'check-circle'
  | 'phone-x'
  | 'power'
  | 'pause'
  | 'x-circle'
  | 'calendar'
  | 'prohibition'
  | 'phone-missed'
  | 'check-double';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statistics.component.html',
})
export class StatisticsComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly clients = signal<Client[]>([]);
  readonly users = signal<EmployeeUser[]>([]);
  readonly projectSources = signal<ProjectSource[]>([]);
  readonly filterType = signal<'all' | 'employee' | 'source'>('all');
  readonly selectedEmployee = signal('');
  readonly selectedSource = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly loading = signal(true);

  readonly user = computed(() => this.auth.user());

  constructor() {
    void this.fetchData();
  }

  async fetchData(): Promise<void> {
    const u = this.user();
    if (!u) return;
    this.loading.set(true);
    try {
      const [clientsRes, usersRes, sourcesRes] = await Promise.all([
        firstValueFrom(this.http.get<Client[]>('/api/clients')),
        u.role === 'admin' ? firstValueFrom(this.http.get<EmployeeUser[]>('/api/users')) : Promise.resolve([] as EmployeeUser[]),
        firstValueFrom(this.http.get<ProjectSource[]>('/api/project-sources')),
      ]);
      this.clients.set(clientsRes);
      this.users.set(usersRes.filter((x) => (x.role === 'sales' || x.role === 'mapping') && x.isActive));
      this.projectSources.set(sourcesRes);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  getFilteredClients(): Client[] {
    const u = this.user();
    if (!u) return [];
    let filtered = [...this.clients()];
    if (u.role !== 'admin') {
      filtered = filtered.filter((c) => c.assignedTo?._id === u.id);
    }
    if (this.filterType() === 'employee' && this.selectedEmployee()) {
      filtered = filtered.filter((c) => c.assignedTo?._id === this.selectedEmployee());
    }
    if (this.filterType() === 'source' && this.selectedSource()) {
      filtered = filtered.filter((c) => c.source === this.selectedSource());
    }
    const df = this.dateFrom();
    const dt = this.dateTo();
    if (df || dt) {
      filtered = filtered.filter((c) => {
        const createdDate = new Date(c.createdAt || 0);
        if (df && dt) {
          const fromDate = new Date(df);
          const toDate = new Date(dt);
          toDate.setHours(23, 59, 59, 999);
          return createdDate >= fromDate && createdDate <= toDate;
        }
        if (df && !dt) return createdDate >= new Date(df);
        if (!df && dt) {
          const toDate = new Date(dt);
          toDate.setHours(23, 59, 59, 999);
          return createdDate <= toDate;
        }
        return true;
      });
    }
    return filtered;
  }

  activeSources(): string[] {
    return this.projectSources()
      .map((s) => s.name)
      .sort((a, b) => a.localeCompare(b));
  }

  getStatusCount(key: string): number {
    return this.getFilteredClients().filter((c) => c.status === key).length;
  }

  totalLeads(): number {
    return this.getFilteredClients().length;
  }

  pct(count: number): string {
    const t = this.totalLeads();
    return t > 0 ? ((count / t) * 100).toFixed(1) : '0';
  }

  onFilterTypeChange(v: string): void {
    this.filterType.set(v as 'all' | 'employee' | 'source');
    this.selectedEmployee.set('');
    this.selectedSource.set('');
  }

  clearFilters(): void {
    this.filterType.set('all');
    this.selectedEmployee.set('');
    this.selectedSource.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  showClear(): boolean {
    return (
      this.filterType() !== 'all' ||
      !!this.selectedEmployee() ||
      !!this.selectedSource() ||
      !!this.dateFrom() ||
      !!this.dateTo()
    );
  }

  selectedEmployeeName(): string {
    const id = this.selectedEmployee();
    if (!id) return '';
    return this.users().find((u) => u._id === id)?.name || '';
  }

  /** Order and styling aligned with Lead Statistics reference UI */
  readonly statusStats: Array<{
    key: string;
    label: string;
    icon: StatisticsStatusIcon;
    iconWrap: string;
    iconClass: string;
    cardClass: string;
    countClass: string;
    barClass: string;
    trackClass: string;
  }> = [
    {
      key: 'pending',
      label: 'Pending',
      icon: 'clock',
      iconWrap: 'bg-amber-500/15 ring-1 ring-amber-500/30',
      iconClass: 'text-amber-400',
      cardClass: 'border-amber-500/25 bg-slate-800/90 shadow-sm shadow-amber-900/10',
      countClass: 'text-amber-400',
      barClass: 'bg-amber-500',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'no-response',
      label: 'No Response',
      icon: 'phone-slash',
      iconWrap: 'bg-slate-500/15 ring-1 ring-slate-500/30',
      iconClass: 'text-slate-400',
      cardClass: 'border-slate-500/25 bg-slate-800/90',
      countClass: 'text-slate-300',
      barClass: 'bg-slate-400',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'not-interested',
      label: 'Not Interested',
      icon: 'thumb-down',
      iconWrap: 'bg-rose-500/15 ring-1 ring-rose-500/30',
      iconClass: 'text-rose-400',
      cardClass: 'border-rose-500/25 bg-slate-800/90 shadow-sm shadow-rose-900/10',
      countClass: 'text-rose-400',
      barClass: 'bg-rose-500',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'qualified',
      label: 'Qualified',
      icon: 'check-circle',
      iconWrap: 'bg-emerald-500/15 ring-1 ring-emerald-500/30',
      iconClass: 'text-emerald-400',
      cardClass: 'border-emerald-500/25 bg-slate-800/90',
      countClass: 'text-emerald-400',
      barClass: 'bg-emerald-500',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'number-inactive',
      label: 'Number Inactive',
      icon: 'phone-x',
      iconWrap: 'bg-orange-500/15 ring-1 ring-orange-500/30',
      iconClass: 'text-orange-400',
      cardClass: 'border-orange-500/25 bg-slate-800/90',
      countClass: 'text-orange-400',
      barClass: 'bg-orange-500',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'number-switched-off',
      label: 'Number Switched Off',
      icon: 'power',
      iconWrap: 'bg-pink-500/15 ring-1 ring-pink-500/30',
      iconClass: 'text-pink-400',
      cardClass: 'border-pink-500/25 bg-slate-800/90',
      countClass: 'text-pink-400',
      barClass: 'bg-pink-500',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'on-hold',
      label: 'On Hold',
      icon: 'pause',
      iconWrap: 'bg-sky-500/15 ring-1 ring-sky-500/30',
      iconClass: 'text-sky-400',
      cardClass: 'border-sky-500/25 bg-slate-800/90',
      countClass: 'text-sky-400',
      barClass: 'bg-sky-500',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'no-requirement',
      label: 'No Requirement',
      icon: 'x-circle',
      iconWrap: 'bg-gray-500/15 ring-1 ring-gray-500/30',
      iconClass: 'text-gray-400',
      cardClass: 'border-gray-500/25 bg-slate-800/90',
      countClass: 'text-gray-300',
      barClass: 'bg-gray-500',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'follow-up',
      label: 'Follow Up',
      icon: 'calendar',
      iconWrap: 'bg-blue-500/15 ring-1 ring-blue-500/30',
      iconClass: 'text-blue-400',
      cardClass: 'border-blue-500/25 bg-slate-800/90',
      countClass: 'text-blue-400',
      barClass: 'bg-blue-500',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'disqualified',
      label: 'Disqualified',
      icon: 'prohibition',
      iconWrap: 'bg-orange-600/15 ring-1 ring-orange-500/35',
      iconClass: 'text-orange-400',
      cardClass: 'border-orange-600/30 bg-slate-800/90',
      countClass: 'text-orange-400',
      barClass: 'bg-orange-600',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'disconnected',
      label: 'Disconnected',
      icon: 'phone-missed',
      iconWrap: 'bg-violet-500/15 ring-1 ring-violet-500/30',
      iconClass: 'text-violet-400',
      cardClass: 'border-violet-500/25 bg-slate-800/90',
      countClass: 'text-violet-400',
      barClass: 'bg-violet-500',
      trackClass: 'bg-slate-700/80',
    },
    {
      key: 'already-finalised',
      label: 'Already Finalised',
      icon: 'check-double',
      iconWrap: 'bg-teal-500/15 ring-1 ring-teal-500/30',
      iconClass: 'text-teal-400',
      cardClass: 'border-teal-500/25 bg-slate-800/90',
      countClass: 'text-teal-400',
      barClass: 'bg-teal-500',
      trackClass: 'bg-slate-700/80',
    },
  ];
}
