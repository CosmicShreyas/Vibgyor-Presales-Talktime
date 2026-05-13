import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Client, EmployeeUser, ProjectSource } from '../../models';
import { buildClientHierarchicalGroups } from '../../core/lead-grouping.util';
import {
  LeadErrorEntry,
  validatePhoneNumber,
} from '../../core/lead-ui';
import { ParsedLeadRow } from './csv-import.parser';
import { LeadsTableComponent } from './leads-table.component';
import { CsvImportModalComponent } from './csv-import-modal.component';
import { ClientGroupedLeadsComponent } from './client-grouped-leads.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { AutoAssignmentModalComponent } from '../auto-assignment/auto-assignment-modal.component';

@Component({
  selector: 'app-client-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    LeadsTableComponent,
    CsvImportModalComponent,
    ClientGroupedLeadsComponent,
    ConfirmDialogComponent,
    AutoAssignmentModalComponent,
  ],
  templateUrl: './client-management.component.html',
})
export class ClientManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly statsChanged = output<void>();
  readonly goUnassigned = output<void>();

  readonly clients = signal<Client[]>([]);
  readonly users = signal<EmployeeUser[]>([]);
  readonly projectSources = signal<ProjectSource[]>([]);
  readonly loading = signal(false);
  readonly refreshing = signal(false);
  readonly showModal = signal(false);
  readonly showImportModal = signal(false);
  readonly showSourceModal = signal(false);
  readonly showAutoAssignModal = signal(false);
  readonly showBulkModal = signal(false);
  readonly editingClient = signal<Client | null>(null);
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly itemsPerPage = 20;
  readonly selectedIds = signal<string[]>([]);
  readonly viewMode = signal<'grouped' | 'flat'>('grouped');
  readonly expanded = signal<Record<string, boolean>>({});
  readonly deleteConfirm = signal({ isOpen: false, id: '' as string | null, name: '' });
  readonly deleteAllOpen = signal(false);
  readonly pendingBulkDelete = signal<{ leads: Client[]; label: string } | null>(null);
  readonly toast = signal<{ message: string; type: string } | null>(null);
  readonly importing = signal(false);
  readonly bulkAssignTo = signal('');
  readonly bulkAssigning = signal(false);
  readonly savingSource = signal(false);
  readonly editingSource = signal<ProjectSource | null>(null);
  readonly deleteSourceConfirm = signal({ isOpen: false, id: '' as string | null, name: '' });
  readonly leadsWithErrors = signal<LeadErrorEntry[]>(this.loadErrorsFromStorage());

  constructor() {
    effect(() => {
      localStorage.setItem('leadsWithErrors', JSON.stringify(this.leadsWithErrors()));
    });
  }

  readonly user = computed(() => this.auth.user());

  sourceForm = { name: '', description: '' };

  formData = {
    name: '',
    phone: '',
    email: '',
    company: '',
    assignedTo: '',
    status: 'pending',
    priority: 'medium',
    notes: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    description: '',
    source: '',
    budget: '',
    tags: '',
  };

  readonly filteredClients = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.clients().filter((c) => {
      if (c.isUnassigned === true) return false;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(this.searchQuery())) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.uniqueId && c.uniqueId.toLowerCase().includes(q))
      );
    });
  });

  readonly stagingCount = computed(() => this.clients().filter((c) => c.isUnassigned === true).length);

  readonly hierarchyBundle = computed(() => buildClientHierarchicalGroups(this.filteredClients()));

  ngOnInit(): void {
    void this.initializeData();
  }

  private loadErrorsFromStorage(): LeadErrorEntry[] {
    try {
      const raw = localStorage.getItem('leadsWithErrors');
      return raw ? (JSON.parse(raw) as LeadErrorEntry[]) : [];
    } catch {
      return [];
    }
  }

  private persistErrors(err: LeadErrorEntry[]): void {
    this.leadsWithErrors.set(err);
  }

  async initializeData(): Promise<void> {
    const u = this.user();
    if (u?.role === 'admin') {
      const last = localStorage.getItem('mappingLeadsLastSync');
      const now = Date.now();
      const CACHE = 5 * 60 * 1000;
      if (!last || now - parseInt(last, 10) > CACHE) {
        await this.syncMappingLeads();
        localStorage.setItem('mappingLeadsLastSync', now.toString());
        localStorage.setItem('mappingLeadsCached', 'true');
      }
      await this.fetchUsers();
    }
    await this.fetchClients();
    await this.fetchProjectSources();
  }

  async syncMappingLeads(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; imported?: number; updated?: number; skipped?: number }>(
          '/api/mapping-sync/sync',
          {},
        ),
      );
      if (res.success && ((res.imported ?? 0) > 0 || (res.updated ?? 0) > 0)) {
        this.showToast(`Mapping sync: ${res.imported ?? 0} new, ${res.updated ?? 0} updated, ${res.skipped ?? 0} skipped`, 'success');
      }
    } catch {
      /* quiet */
    }
  }

  async fetchClients(): Promise<void> {
    this.refreshing.set(true);
    try {
      const data = await firstValueFrom(this.http.get<Client[]>('/api/clients'));
      this.clients.set(data);
      if (data.some((c) => c.importMethod === 'mapping')) {
        localStorage.setItem('mappingLeadsLastSync', Date.now().toString());
      }
    } catch (e) {
      console.error(e);
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

  async fetchProjectSources(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<ProjectSource[]>('/api/project-sources'));
      this.projectSources.set(data);
    } catch {
      this.projectSources.set([]);
    }
  }

  showToast(message: string, type: string): void {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 4000);
  }

  async onAutoAssignmentProcessed(): Promise<void> {
    await this.fetchClients();
    this.statsChanged.emit();
  }

  paginatedClients(): Client[] {
    const f = this.filteredClients();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return f.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredClients().length / this.itemsPerPage));
  }

  startIndex(): number {
    return (this.currentPage() - 1) * this.itemsPerPage;
  }

  endIndex(): number {
    return Math.min(this.startIndex() + this.itemsPerPage, this.filteredClients().length);
  }

  isAllPageSelected(): boolean {
    const page = this.paginatedClients();
    return page.length > 0 && page.every((c) => this.selectedIds().includes(c._id));
  }

  toggleExpand(key: string): void {
    const e = { ...this.expanded() };
    e[key] = !e[key];
    this.expanded.set(e);
  }

  toggleSelect(id: string): void {
    const cur = this.selectedIds();
    if (cur.includes(id)) this.selectedIds.set(cur.filter((x) => x !== id));
    else this.selectedIds.set([...cur, id]);
  }

  toggleSelectAllPage(checked: boolean): void {
    const ids = this.paginatedClients().map((c) => c._id);
    if (checked) this.selectedIds.set([...new Set([...this.selectedIds(), ...ids])]);
    else this.selectedIds.set(this.selectedIds().filter((id) => !ids.includes(id)));
  }

  resetForm(): void {
    const u = this.user();
    this.formData = {
      name: '',
      phone: '',
      email: '',
      company: '',
      assignedTo: u?.role === 'admin' ? '' : u?.id || '',
      status: 'pending',
      priority: 'medium',
      notes: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      description: '',
      source: '',
      budget: '',
      tags: '',
    };
    this.editingClient.set(null);
  }

  closeLeadModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  openModal(client: Client | null = null): void {
    const u = this.user();
    if (client) {
      this.editingClient.set(client);
      this.formData = {
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        company: client.company || '',
        assignedTo: client.assignedTo?._id || '',
        status: client.status,
        priority: client.priority || 'medium',
        notes: client.notes || '',
        alternatePhone: client.alternatePhone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        description: client.description || '',
        source: client.source || '',
        budget: client.budget || '',
        tags: client.tags || '',
      };
    } else {
      this.resetForm();
    }
    this.showModal.set(true);
  }

  async saveLead(ev: Event): Promise<void> {
    ev.preventDefault();
    const u = this.user();
    if (!u) return;
    if (u.role === 'admin' && !this.editingClient() && !this.formData.assignedTo?.trim()) {
      this.showToast('Please select an employee (Assign To)', 'error');
      return;
    }
    const pv = validatePhoneNumber(this.formData.phone);
    if (!pv.valid) {
      this.showToast(`Phone: ${pv.message}`, 'error');
      return;
    }
    if (this.formData.alternatePhone) {
      const av = validatePhoneNumber(this.formData.alternatePhone);
      if (!av.valid) {
        this.showToast(`Alternate phone: ${av.message}`, 'error');
        return;
      }
    }
    const submit: Record<string, unknown> = { ...this.formData };
    if (u.role !== 'admin') submit['assignedTo'] = u.id;
    this.loading.set(true);
    try {
      const ed = this.editingClient();
      if (ed) {
        await firstValueFrom(this.http.put(`/api/clients/${ed._id}`, submit));
        this.showToast('Lead updated', 'success');
      } else {
        await firstValueFrom(this.http.post<Client>('/api/clients', submit));
        this.showToast('Lead created', 'success');
      }
      await this.fetchClients();
      this.statsChanged.emit();
      this.closeLeadModal();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.showToast(err.error?.message || 'Save failed', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  requestDelete(c: Client): void {
    this.deleteConfirm.set({ isOpen: true, id: c._id, name: c.name });
  }

  async confirmDelete(): Promise<void> {
    const id = this.deleteConfirm().id;
    if (!id) return;
    try {
      await firstValueFrom(this.http.delete(`/api/clients/${id}`));
      this.showToast('Lead deleted', 'success');
      await this.fetchClients();
      this.statsChanged.emit();
    } catch {
      this.showToast('Delete failed', 'error');
    } finally {
      this.deleteConfirm.set({ isOpen: false, id: null, name: '' });
    }
  }

  async confirmDeleteAll(): Promise<void> {
    try {
      const sel = this.selectedIds();
      if (sel.length > 0) {
        await Promise.all(sel.map((id) => firstValueFrom(this.http.delete(`/api/clients/${id}`))));
        this.showToast(`Deleted ${sel.length} lead(s)`, 'success');
        this.selectedIds.set([]);
      } else {
        await firstValueFrom(this.http.delete('/api/clients/all/delete-all'));
        this.persistErrors([]);
        this.showToast('All leads deleted', 'success');
      }
      await this.fetchClients();
      this.statsChanged.emit();
    } catch {
      this.showToast('Delete failed', 'error');
    } finally {
      this.deleteAllOpen.set(false);
    }
  }

  async bulkAssign(): Promise<void> {
    const to = this.bulkAssignTo();
    const sel = this.selectedIds();
    if (!to || sel.length === 0) {
      this.showToast('Select employee and leads', 'error');
      return;
    }
    this.bulkAssigning.set(true);
    try {
      await Promise.all(
        sel.map((id) =>
          firstValueFrom(this.http.put(`/api/clients/${id}`, { assignedTo: to, isUnassigned: false })),
        ),
      );
      this.showToast(`Assigned ${sel.length} lead(s)`, 'success');
      this.selectedIds.set([]);
      this.showBulkModal.set(false);
      this.bulkAssignTo.set('');
      await this.fetchClients();
      this.statsChanged.emit();
    } catch {
      this.showToast('Bulk assign failed', 'error');
    } finally {
      this.bulkAssigning.set(false);
    }
  }

  async handleCsvImport(payload: { leads: ParsedLeadRow[]; fileName: string }): Promise<void> {
    const u = this.user();
    if (!u) return;
    this.importing.set(true);
    const { leads, fileName } = payload;
    try {
      const existing = this.clients().find((c) => c.importMethod === 'csv' && c.csvFileName === fileName);
      let csvImportId: string;
      if (existing?.csvImportId) {
        csvImportId = existing.csvImportId;
      } else {
        csvImportId = `CSV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }
      let csvImportsSource = this.projectSources().find((s) => s.name === 'CSV Imports');
      if (!csvImportsSource) {
        try {
          csvImportsSource = await firstValueFrom(
            this.http.post<ProjectSource>('/api/project-sources', {
              name: 'CSV Imports',
              description: 'Automatically created for CSV imported leads',
            }),
          );
          await this.fetchProjectSources();
        } catch {
          /* continue */
        }
      }
      const importedErr: LeadErrorEntry[] = [];
      for (const lead of leads) {
        let assignedToId = u.id;
        let isUnassigned = true;
        if (lead.assignTo?.trim()) {
          const emp = this.users().find(
            (e) =>
              e.name.toLowerCase() === lead.assignTo.toLowerCase().trim() ||
              e.email.toLowerCase() === lead.assignTo.toLowerCase().trim(),
          );
          if (emp) {
            assignedToId = emp._id;
            isUnassigned = false;
          } else isUnassigned = true;
        }
        const leadData = {
          name: lead.name,
          phone: lead.phone,
          alternatePhone: lead.alternatePhone || '',
          email: lead.email || '',
          company: lead.company || '',
          address: lead.address || '',
          city: lead.city || '',
          state: lead.state || '',
          description: lead.description || '',
          source: 'CSV Imports',
          budget: lead.budget || '',
          tags: lead.tags || '',
          assignedTo: assignedToId,
          status: lead.status || 'pending',
          priority: 'medium',
          notes: lead.notes || '',
          importMethod: 'csv',
          csvFileName: fileName,
          csvImportId,
          importedAt: new Date(),
          isUnassigned,
        };
        try {
          const created = await firstValueFrom(this.http.post<Client>('/api/clients', leadData));
          if (lead.hasPhoneError || lead.hasAltPhoneError) {
            importedErr.push({
              id: created._id,
              name: lead.name,
              phone: lead.phone,
              hasPhoneError: lead.hasPhoneError,
              phoneErrorMessage: lead.phoneErrorMessage,
              hasAltPhoneError: lead.hasAltPhoneError,
              altPhoneErrorMessage: lead.altPhoneErrorMessage,
            });
          }
        } catch {
          /* skip row */
        }
      }
      this.persistErrors(importedErr);
      await this.fetchClients();
      this.statsChanged.emit();
      this.showToast(`Imported ${leads.length} row(s) from CSV`, 'success');
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.showToast(err.error?.message || 'Import failed', 'error');
    } finally {
      this.importing.set(false);
    }
  }

  async saveSource(ev: Event): Promise<void> {
    ev.preventDefault();
    this.savingSource.set(true);
    try {
      const ed = this.editingSource();
      if (ed) {
        await firstValueFrom(this.http.put(`/api/project-sources/${ed._id}`, this.sourceForm));
        this.showToast('Source updated', 'success');
      } else {
        await firstValueFrom(this.http.post('/api/project-sources', this.sourceForm));
        this.showToast('Source created', 'success');
      }
      await this.fetchProjectSources();
      this.sourceForm = { name: '', description: '' };
      this.editingSource.set(null);
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.showToast(err.error?.message || 'Save failed', 'error');
    } finally {
      this.savingSource.set(false);
    }
  }

  editSource(s: ProjectSource): void {
    this.editingSource.set(s);
    this.sourceForm = { name: s.name, description: s.description || '' };
  }

  cancelSource(): void {
    this.editingSource.set(null);
    this.sourceForm = { name: '', description: '' };
  }

  closeSourceModal(): void {
    this.cancelSource();
    this.showSourceModal.set(false);
  }

  requestDeleteSource(s: ProjectSource): void {
    this.deleteSourceConfirm.set({ isOpen: true, id: s._id, name: s.name });
  }

  async confirmDeleteProjectSource(): Promise<void> {
    const id = this.deleteSourceConfirm().id;
    if (!id) return;
    try {
      await firstValueFrom(this.http.delete(`/api/project-sources/${id}`));
      await this.fetchProjectSources();
      this.showToast('Source deleted', 'success');
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.showToast(err.error?.message || 'Delete failed', 'error');
    } finally {
      this.deleteSourceConfirm.set({ isOpen: false, id: null, name: '' });
    }
  }

  async confirmDeleteSourceLeads(): Promise<void> {
    const pack = this.pendingBulkDelete();
    if (!pack) return;
    try {
      await Promise.all(pack.leads.map((l) => firstValueFrom(this.http.delete(`/api/clients/${l._id}`))));
      if (pack.leads.some((l) => l.importMethod === 'mapping')) {
        localStorage.removeItem('mappingLeadsLastSync');
        localStorage.removeItem('mappingLeadsCached');
      }
      this.showToast(`Deleted ${pack.leads.length} from ${pack.label}`, 'success');
      await this.fetchClients();
      this.statsChanged.emit();
      this.selectedIds.set([]);
    } catch {
      this.showToast('Bulk delete failed', 'error');
    } finally {
      this.pendingBulkDelete.set(null);
    }
  }

  clearErrorHighlights(): void {
    this.persistErrors([]);
  }

  prevClientPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextClientPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }
}
