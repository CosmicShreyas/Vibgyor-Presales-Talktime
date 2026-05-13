import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { LeadsIconComponent } from './leads-icon.component';
import {
  EMPTY_DRAFT,
  FILTERS,
  Lead,
  LeadDraft,
  LeadErrors,
  PRIORITY_STYLES,
  STATUS_STYLES,
  Status,
  mapApiLead,
  validateDraft,
} from './leads.models';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, LeadsIconComponent],
  templateUrl: './leads.component.html',
})
export class LeadsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly filters = FILTERS;
  readonly statusStyles = STATUS_STYLES;
  readonly priorityStyles = PRIORITY_STYLES;
  readonly priorities: LeadDraft['priority'][] = ['Low', 'Medium', 'High'];

  query = '';
  active: Status | 'All' = 'All';
  rows: Lead[] = [];
  allRows: Lead[] = [];
  loading = true;
  fetchError: string | null = null;

  dialogOpen = false;
  files: File[] = [];
  importing = false;
  importResult: { success: number; failed: number; errors: string[] } | null = null;

  addOpen = false;
  addDraft: LeadDraft = { ...EMPTY_DRAFT };
  addErrors: LeadErrors = {};
  addSubmitting = false;

  deleteId: string | null = null;
  viewLead: Lead | null = null;
  editLead: Lead | null = null;
  editDraft: Lead | null = null;
  editErrors: LeadErrors = {};

  filterFrom = '';
  filterTo = '';
  appliedFrom = '';
  appliedTo = '';
  filterOpen = false;
  newLeadMenuOpen = false;

  @ViewChild('csvInput') csvInput?: ElementRef<HTMLInputElement>;
  @ViewChild('newLeadMenuRoot') newLeadMenuRoot?: ElementRef<HTMLElement>;
  @ViewChild('filterMenuRoot') filterMenuRoot?: ElementRef<HTMLElement>;

  @HostListener('document:click', ['$event'])
  closeMenusOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Node;
    const newLeadRoot = this.newLeadMenuRoot?.nativeElement;
    const filterRoot = this.filterMenuRoot?.nativeElement;

    if (this.newLeadMenuOpen && newLeadRoot && !newLeadRoot.contains(target)) {
      this.newLeadMenuOpen = false;
    }
    if (this.filterOpen && filterRoot && !filterRoot.contains(target)) {
      this.filterOpen = false;
    }
  }

  async ngOnInit(): Promise<void> {
    await this.loadLeads();
  }

  get yetToContactCount(): number {
    return this.rows.filter((lead) => lead.status === 'Yet to contact').length;
  }

  get filtered(): Lead[] {
    const query = this.query.toLowerCase();
    return this.rows.filter((lead) => {
      const matchesStatus = this.active === 'All' || lead.status === this.active;
      const matchesQuery =
        !query ||
        lead.name.toLowerCase().includes(query) ||
        lead.city.toLowerCase().includes(query) ||
        lead.project.toLowerCase().includes(query) ||
        lead.id.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }

  private async loadLeads(): Promise<void> {
    if (!this.auth.token()) return;
    this.loading = true;
    try {
      const data = await firstValueFrom(
        this.http.get<{
          leads: Parameters<typeof mapApiLead>[0][];
        }>('/api/brand-partners/leads'),
      );
      const mapped = data.leads.flatMap((lead) => {
        const item = mapApiLead(lead);
        return item ? [item] : [];
      });
      this.rows = mapped;
      this.allRows = mapped;
    } catch (error: unknown) {
      this.fetchError = error instanceof Error ? error.message : 'Failed to fetch leads';
    } finally {
      this.loading = false;
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(input.files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.addFiles(event.dataTransfer?.files ?? null);
  }

  private addFiles(incoming: FileList | null): void {
    if (!incoming) return;
    const csvFiles = Array.from(incoming).filter((file) => file.name.endsWith('.csv'));
    const names = new Set(this.files.map((file) => file.name));
    this.files = [...this.files, ...csvFiles.filter((file) => !names.has(file.name))];
  }

  removeFile(name: string): void {
    this.files = this.files.filter((file) => file.name !== name);
  }

  closeImportDialog(): void {
    this.dialogOpen = false;
    this.files = [];
    this.importResult = null;
  }

  async handleImport(): Promise<void> {
    if (!this.files.length || !this.auth.token()) return;
    this.importing = true;
    this.importResult = null;
    try {
      const form = new FormData();
      form.append('csvFile', this.files[0]);
      const data = await firstValueFrom(
        this.http.post<{ success: number; failed: number; errors: string[] }>('/api/brand-partners/leads/import', form),
      );
      this.importResult = { success: data.success ?? 0, failed: data.failed ?? 0, errors: data.errors ?? [] };
      if (this.importResult.success > 0) {
        this.files = [];
        await this.loadLeads();
      }
    } catch {
      this.importResult = { success: 0, failed: 0, errors: ['Network error. Please try again.'] };
    } finally {
      this.importing = false;
    }
  }

  openAddDialog(): void {
    this.newLeadMenuOpen = false;
    this.filterOpen = false;
    this.addDraft = { ...EMPTY_DRAFT };
    this.addErrors = {};
    this.addOpen = true;
  }

  openCsvDialog(): void {
    this.newLeadMenuOpen = false;
    this.filterOpen = false;
    this.dialogOpen = true;
  }

  toggleNewLeadMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.filterOpen = false;
    this.newLeadMenuOpen = !this.newLeadMenuOpen;
  }

  toggleFilterMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.newLeadMenuOpen = false;
    this.filterOpen = !this.filterOpen;
  }

  triggerCsvBrowse(): void {
    this.csvInput?.nativeElement.click();
  }

  patchAddDraft(patch: Partial<LeadDraft>): void {
    this.addDraft = { ...this.addDraft, ...patch };
  }

  closeAddDialog(): void {
    this.addOpen = false;
    this.addErrors = {};
    this.addDraft = { ...EMPTY_DRAFT };
  }

  async submitAdd(): Promise<void> {
    const errors = validateDraft(this.addDraft);
    if (Object.keys(errors).length) {
      this.addErrors = errors;
      return;
    }
    this.addSubmitting = true;
    try {
      const data = await firstValueFrom(
        this.http.post<{ success: number; failed: number; errors: string[] }>('/api/brand-partners/leads/import', {
          leads: [
            {
              name: this.addDraft.name,
              phone: this.addDraft.phone,
              alternatePhone: this.addDraft.altPhone,
              email: this.addDraft.email,
              project: this.addDraft.project,
              address: this.addDraft.address,
              city: this.addDraft.city,
              state: this.addDraft.state,
              remarks: this.addDraft.remarks,
            },
          ],
        }),
      );
      if (data.success > 0) {
        await this.loadLeads();
        this.closeAddDialog();
      } else {
        this.addErrors = { name: data.errors?.[0] ?? 'Failed to submit lead' };
      }
    } catch {
      this.addErrors = { name: 'Network error. Please try again.' };
    } finally {
      this.addSubmitting = false;
    }
  }

  openEdit(lead: Lead): void {
    this.editLead = lead;
    this.editDraft = { ...lead };
    this.editErrors = {};
  }

  closeEdit(): void {
    this.editLead = null;
    this.editErrors = {};
  }

  async submitEdit(): Promise<void> {
    if (!this.editDraft) return;
    const errors = validateDraft(this.editDraft);
    if (Object.keys(errors).length) {
      this.editErrors = errors;
      return;
    }
    try {
      await firstValueFrom(
        this.http.put(`/api/brand-partners/leads/${this.editDraft.id}`, {
          name: this.editDraft.name,
          city: this.editDraft.city,
          state: this.editDraft.state,
          project: this.editDraft.project,
          budget: this.editDraft.budget,
          remarks: this.editDraft.remarks,
        }),
      );
      this.rows = this.rows.map((row) => (row.id === this.editDraft!.id ? this.editDraft! : row));
      this.allRows = this.allRows.map((row) => (row.id === this.editDraft!.id ? this.editDraft! : row));
      this.closeEdit();
    } catch (error: unknown) {
      this.editErrors = { name: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  applyDateFilter(): void {
    if (!this.filterFrom || !this.filterTo) return;
    const from = new Date(this.filterFrom);
    const to = new Date(`${this.filterTo}T23:59:59`);
    this.rows = this.allRows.filter((lead) => {
      const created = new Date(lead.createdAtRaw);
      return created >= from && created <= to;
    });
    this.appliedFrom = this.filterFrom;
    this.appliedTo = this.filterTo;
    this.filterOpen = false;
  }

  clearDateFilter(): void {
    this.filterFrom = '';
    this.filterTo = '';
    this.appliedFrom = '';
    this.appliedTo = '';
    this.rows = this.allRows;
    this.filterOpen = false;
  }

  async confirmDelete(): Promise<void> {
    if (!this.deleteId) return;
    try {
      await firstValueFrom(this.http.delete(`/api/brand-partners/leads/${this.deleteId}`));
      this.rows = this.rows.filter((row) => row.id !== this.deleteId);
      this.allRows = this.allRows.filter((row) => row.id !== this.deleteId);
    } catch {
      // keep row on failure
    }
    this.deleteId = null;
  }

  formatBudget(value: string): string {
    return `₹ ${Number(value).toLocaleString('en-IN')}`;
  }
}
