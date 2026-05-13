import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { LeadStatistics } from '../../models';
import { StatCardComponent } from '../../shared/stat-card.component';
import { StatIconComponent, StatIconName } from '../../shared/stat-icon.component';

type Range = { label: string; period: 'monthly' | 'quarterly' | 'ytd' };

type DashboardCard = {
  label: string;
  value: number;
  description: string;
  icon: StatIconName;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent, StatIconComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly ranges: Range[] = [
    { label: 'Monthly', period: 'monthly' },
    { label: 'Quarterly', period: 'quarterly' },
    { label: 'Year to date', period: 'ytd' },
  ];

  range: Range = this.ranges[0];
  partnerName: string | null = null;
  stats: LeadStatistics | null = null;
  loading = true;

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
    await this.loadStats();
  }

  async setRange(range: Range): Promise<void> {
    this.range = range;
    await this.loadStats();
  }

  private async loadProfile(): Promise<void> {
    if (!this.auth.token()) return;
    try {
      const data = await firstValueFrom(
        this.http.get<{ partnerName?: string; contactPerson1?: string }>('/api/brand-partners/profile'),
      );
      this.partnerName = data.partnerName ?? data.contactPerson1 ?? null;
    } catch {
      this.partnerName = null;
    }
  }

  private async loadStats(): Promise<void> {
    if (!this.auth.token()) return;
    this.loading = true;
    try {
      const data = await firstValueFrom(
        this.http.get<{ success: boolean; statistics: LeadStatistics }>(
          `/api/brand-partners/leads/statistics?period=${this.range.period}`,
        ),
      );
      if (data.success) this.stats = data.statistics;
    } catch {
      this.stats = null;
    } finally {
      this.loading = false;
    }
  }

  get cards(): DashboardCard[] {
    const stats = this.stats ?? {
      totalLeads: 0,
      yetToContact: 0,
      followUp: 0,
      qualified: 0,
      disqualified: 0,
      lost: 0,
      won: 0,
    };

    return [
      {
        label: 'Total leads',
        value: stats.totalLeads,
        description: 'Across all current and past opportunities',
        icon: 'users',
      },
      {
        label: 'Yet to contact',
        value: stats.yetToContact,
        description: 'Largest bucket that needs immediate action',
        icon: 'phone',
      },
      {
        label: 'Follow-up',
        value: stats.followUp,
        description: 'Warm leads waiting for the next touchpoint',
        icon: 'refresh',
      },
      {
        label: 'Qualified',
        value: stats.qualified,
        description: 'High-intent leads ready to move ahead',
        icon: 'check-circle',
      },
      {
        label: 'Disqualified',
        value: stats.disqualified,
        description: 'Leads removed due to mismatch or drop-off',
        icon: 'user-x',
      },
      {
        label: 'Lost',
        value: stats.lost,
        description: 'Closed opportunities that did not convert',
        icon: 'ban',
      },
      {
        label: 'Won',
        value: stats.won,
        description: 'Converted into confirmed business',
        icon: 'trophy',
      },
    ];
  }
}
