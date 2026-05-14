import { Component, OnInit, inject, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Client, EmployeeUser, HierarchicalGroup, HierarchicalParentGroup, ProjectSource } from '../../models';
import { buildClientHierarchicalGroups } from '../../core/lead-grouping.util';
import { getGroupInfo } from '../../core/lead-ui';
import { groupedSingleRowVisual, type GroupedSingleRowVisual } from '../../core/lead-group-row-styles';
import { AutoAssignmentModalComponent } from '../auto-assignment/auto-assignment-modal.component';
import { UnassignedLeadsTableComponent } from './unassigned-leads-table.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-unassigned-leads',
  standalone: true,
  imports: [CommonModule, AutoAssignmentModalComponent, UnassignedLeadsTableComponent, ConfirmDialogComponent],
  templateUrl: './unassigned-leads.component.html',
})
export class UnassignedLeadsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly statsChanged = output<void>();

  readonly leads = signal<Client[]>([]);
  readonly users = signal<EmployeeUser[]>([]);
  readonly projectSources = signal<ProjectSource[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly refreshing = signal(false);
  readonly viewMode = signal<'grouped' | 'flat'>('grouped');
  readonly currentPage = signal(1);
  readonly itemsPerPage = 20;
  readonly expanded = signal<Record<string, boolean>>({});
  readonly groupPages = signal<Record<string, number>>({});
  readonly toast = signal<{ message: string; type: string } | null>(null);
  readonly showAutoModal = signal(false);
  readonly deleteConfirm = signal({ isOpen: false, id: '' as string | null });

  readonly hierarchy = computed(() => buildClientHierarchicalGroups(this.leads()));
  readonly sortedKeys = computed(() => this.hierarchy().sortedGroupKeys);
  readonly groups = computed(() => this.hierarchy().hierarchicalGroups);

  ngOnInit(): void {
    void this.bootstrap();
  }

  async bootstrap(): Promise<void> {
    await Promise.all([this.fetchLeads(), this.fetchUsers(), this.fetchSources()]);
  }

  async fetchLeads(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<Client[]>('/api/clients/unassigned'));
      this.leads.set(Array.isArray(data) ? data : []);
    } catch {
      this.error.set('Failed to fetch unassigned leads');
      this.leads.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    this.refreshing.set(true);
    try {
      const data = await firstValueFrom(this.http.get<Client[]>('/api/clients/unassigned'));
      this.leads.set(Array.isArray(data) ? data : []);
      this.showToast('Leads refreshed successfully', 'success');
    } catch {
      this.showToast('Failed to refresh leads', 'error');
    } finally {
      this.refreshing.set(false);
    }
  }

  async fetchUsers(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<EmployeeUser[]>('/api/users'));
      this.users.set(data.filter((u) => (u.role === 'sales' || u.role === 'mapping') && u.isActive));
    } catch {
      this.users.set([]);
    }
  }

  async fetchSources(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<ProjectSource[]>('/api/project-sources'));
      this.projectSources.set(data);
    } catch {
      this.projectSources.set([]);
    }
  }

  showToast(message: string, type: string): void {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  isParent(g: HierarchicalGroup): g is HierarchicalParentGroup {
    return g.type === 'parent';
  }

  toggle(key: string): void {
    const cur = { ...this.expanded() };
    cur[key] = !cur[key];
    this.expanded.set(cur);
  }

  isExpanded(key: string): boolean {
    return !!this.expanded()[key];
  }

  groupPage(key: string): number {
    return this.groupPages()[key] || 1;
  }

  setGroupPage(key: string, page: number): void {
    this.groupPages.set({ ...this.groupPages(), [key]: page });
  }

  info = getGroupInfo;

  rowVisual(groupKey: string): GroupedSingleRowVisual {
    return groupedSingleRowVisual(groupKey);
  }

  paginate(leads: Client[], key: string): { rows: Client[]; start: number; totalPages: number; page: number } {
    const page = this.groupPage(key);
    const totalPages = Math.max(1, Math.ceil(leads.length / this.itemsPerPage));
    const start = (page - 1) * this.itemsPerPage;
    return { rows: leads.slice(start, start + this.itemsPerPage), start, totalPages, page };
  }

  flatSlice(): Client[] {
    const p = this.currentPage();
    const all = this.leads();
    const start = (p - 1) * this.itemsPerPage;
    return all.slice(start, start + this.itemsPerPage);
  }

  flatTotalPages(): number {
    return Math.max(1, Math.ceil(this.leads().length / this.itemsPerPage));
  }

  parentTotalLeads(g: HierarchicalParentGroup): number {
    return Object.values(g.subCategories).reduce((sum, sub) => {
      return sum + Object.values(sub.children).reduce((s, arr) => s + arr.length, 0);
    }, 0);
  }

  subCategoryTotal(sub: { children: Record<string, Client[]> }): number {
    return Object.values(sub.children).reduce((s, arr) => s + arr.length, 0);
  }

  requestDelete(id: string): void {
    this.deleteConfirm.set({ isOpen: true, id });
  }

  async confirmDelete(): Promise<void> {
    const id = this.deleteConfirm().id;
    if (!id) return;
    try {
      await firstValueFrom(this.http.delete(`/api/clients/${id}`));
      this.showToast('Lead deleted successfully', 'success');
      await this.fetchLeads();
      this.statsChanged.emit();
    } catch {
      this.showToast('Failed to delete lead', 'error');
    } finally {
      this.deleteConfirm.set({ isOpen: false, id: null });
    }
  }

  onAutoProcessed(): void {
    void this.fetchLeads();
    this.statsChanged.emit();
    this.showAutoModal.set(false);
  }

  objectKeys(obj: object): string[] {
    return Object.keys(obj || {});
  }

  prevFlatPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextFlatPage(): void {
    this.currentPage.update((p) => Math.min(this.flatTotalPages(), p + 1));
  }
}
