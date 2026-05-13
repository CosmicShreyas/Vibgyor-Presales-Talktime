import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Client, EmployeeUser } from '../../models';
import { StatisticsComponent } from '../../features/statistics/statistics.component';
import { ReportsComponent } from '../../features/reports/reports.component';
import { CallHistoryComponent } from '../../features/call-history/call-history.component';
import { UserManagementComponent } from '../../features/user-management/user-management.component';
import { MappingManagementComponent } from '../../features/mapping-management/mapping-management.component';
import { UnassignedLeadsComponent } from '../../features/unassigned-leads/unassigned-leads.component';
import { ClientManagementComponent } from '../../features/client-management/client-management.component';
import { BrandPartnerManagementComponent } from '../../features/brand-partner/brand-partner-management.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatisticsComponent,
    ReportsComponent,
    CallHistoryComponent,
    UserManagementComponent,
    MappingManagementComponent,
    UnassignedLeadsComponent,
    ClientManagementComponent,
    BrandPartnerManagementComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly activeTab = signal<string>('clients');
  readonly stats = signal({
    totalLeads: 0,
    totalUsers: 0,
    pendingCalls: 0,
    completedCalls: 0,
    unassignedLeads: 0,
  });
  readonly showLeadsModal = signal(false);
  readonly leadsGroupedBySource = signal<Record<string, Client[]>>({});

  readonly user = computed(() => this.auth.user());

  constructor() {
    void this.fetchStats();
  }

  async fetchStats(): Promise<void> {
    const u = this.user();
    if (!u) return;
    const prevUnassigned = this.stats().unassignedLeads;
    try {
      const clientsReq = firstValueFrom(this.http.get<Client[]>('/api/clients'));
      const usersReq =
        u.role === 'admin' ? firstValueFrom(this.http.get<EmployeeUser[]>('/api/users')) : Promise.resolve([] as EmployeeUser[]);
      const [leads, users] = await Promise.all([clientsReq, usersReq]);
      const unassigned = leads.filter((l) => l.isUnassigned === true).length;
      const grouped = leads.reduce<Record<string, Client[]>>((acc, lead) => {
        const source = lead.source || 'No Source';
        if (!acc[source]) acc[source] = [];
        acc[source].push(lead);
        return acc;
      }, {});
      this.leadsGroupedBySource.set(grouped);
      this.stats.set({
        totalLeads: leads.length,
        totalUsers: users.length,
        pendingCalls: leads.filter((c) => c.status === 'pending' || c.status === 'no-response' || c.status === 'follow-up').length,
        completedCalls: leads.filter((c) => ['qualified', 'already-finalised', 'closed'].includes(c.status)).length,
        unassignedLeads: unassigned,
      });
      // Match legacy client: only auto-switch when unassigned count *changes* (see Dashboard.jsx deps).
      if (u.role === 'admin' && unassigned > 0 && this.activeTab() === 'clients' && unassigned !== prevUnassigned) {
        this.activeTab.set('unassigned');
      }
    } catch (e) {
      console.error(e);
    }
  }

  sourceKeys(): string[] {
    return Object.keys(this.leadsGroupedBySource()).sort();
  }

  pctForSource(source: string): string {
    const total = this.stats().totalLeads;
    if (!total) return '0';
    const n = this.leadsGroupedBySource()[source]?.length ?? 0;
    return ((n / total) * 100).toFixed(1);
  }
}
