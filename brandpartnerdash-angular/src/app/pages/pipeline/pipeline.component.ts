import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';

type Deal = {
  id: string;
  name: string;
  city: string;
  state: string;
  project: string;
  budget: string;
  date: string;
};

type Column = {
  key: string;
  title: string;
  tint: string;
  deals: Deal[];
};

const COLUMN_DEFS: Omit<Column, 'deals'>[] = [
  { key: 'Yet to contact', title: 'Yet to contact', tint: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300' },
  { key: 'Follow-up', title: 'Follow-up', tint: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { key: 'Qualified', title: 'Qualified', tint: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { key: 'Won', title: 'Won', tint: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { key: 'Lost', title: 'Lost', tint: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  { key: 'Disqualified', title: 'Disqualified', tint: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
];

const STATUS_MAP: Record<string, string> = {
  pending: 'Yet to contact',
  contacted: 'Follow-up',
  'follow-up': 'Follow-up',
  followup: 'Follow-up',
  qualified: 'Qualified',
  converted: 'Won',
  won: 'Won',
  lost: 'Lost',
  disqualified: 'Disqualified',
};

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pipeline.component.html',
  styles: [
    `
      :host {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }
    `,
  ],
})
export class PipelineComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  columns: Column[] = COLUMN_DEFS.map((column) => ({ ...column, deals: [] }));
  loading = true;

  async ngOnInit(): Promise<void> {
    if (!this.auth.token()) return;
    try {
      const data = await firstValueFrom(
        this.http.get<{
          leads: {
            uniqueId: string;
            name: string;
            city: string;
            state: string;
            project: string;
            budget: string;
            status: string;
            createdAt: string;
          }[];
        }>('/api/brand-partners/leads'),
      );

      this.columns = COLUMN_DEFS.map((def) => ({
        ...def,
        deals: data.leads
          .filter((lead) => STATUS_MAP[lead.status?.toLowerCase()] === def.key)
          .map((lead) => ({
            id: lead.uniqueId,
            name: lead.name,
            city: lead.city === 'N/A' ? '' : lead.city,
            state: lead.state === 'N/A' ? '' : lead.state,
            project: lead.project === 'N/A' ? '' : lead.project,
            budget: lead.budget === 'N/A' ? '' : lead.budget,
            date: new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          })),
      }));
    } catch {
      this.columns = COLUMN_DEFS.map((column) => ({ ...column, deals: [] }));
    } finally {
      this.loading = false;
    }
  }

  get grandTotal(): number {
    return this.columns.reduce((total, column) => total + column.deals.length, 0);
  }

  formatBudget(budget: string): string {
    const value = Number(budget);
    return Number.isNaN(value) ? budget : `₹ ${value.toLocaleString('en-IN')}`;
  }
}
