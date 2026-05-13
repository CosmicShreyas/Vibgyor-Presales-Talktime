import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EmployeeUser } from '../../models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-mapping-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './mapping-management.component.html',
})
export class MappingManagementComponent {
  private readonly http = inject(HttpClient);
  readonly users = signal<EmployeeUser[]>([]);
  readonly showModal = signal(false);
  readonly showImportModal = signal(false);
  readonly editingUser = signal<EmployeeUser | null>(null);
  readonly deleteConfirm = signal({ isOpen: false, userId: null as string | null, userName: '' });
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly itemsPerPage = 20;
  readonly refreshing = signal(false);
  readonly loading = signal(false);
  readonly csvFile = signal<File | null>(null);
  readonly importing = signal(false);
  readonly importResult = signal<{ success?: number; failed?: number; errors?: string[] } | null>(null);
  readonly errorModal = signal({ isOpen: false, title: '', message: '' });
  readonly successModal = signal({ isOpen: false, title: '', message: '' });
  formData = { name: '', email: '', password: '' };

  constructor() {
    void this.fetch();
  }

  async fetch(): Promise<void> {
    this.refreshing.set(true);
    try {
      const all = await firstValueFrom(this.http.get<EmployeeUser[]>('/api/users'));
      this.users.set(all.filter((u) => u.role === 'mapping'));
    } catch (e: unknown) {
      this.errorModal.set({
        isOpen: true,
        title: 'Failed to Load',
        message: (e as { error?: { message?: string } })?.error?.message || 'Unable to fetch mapping users.',
      });
    } finally {
      this.refreshing.set(false);
    }
  }

  filtered(): EmployeeUser[] {
    const q = this.searchQuery().toLowerCase();
    return this.users().filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.mappingId && u.mappingId.toLowerCase().includes(q)),
    );
  }

  pageSlice(): EmployeeUser[] {
    const f = this.filtered();
    const s = (this.currentPage() - 1) * this.itemsPerPage;
    return f.slice(s, s + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered().length / this.itemsPerPage));
  }

  openModal(u: EmployeeUser | null = null): void {
    if (u) {
      this.editingUser.set(u);
      this.formData = { name: u.name, email: u.email, password: '' };
    } else {
      this.editingUser.set(null);
      this.formData = { name: '', email: '', password: '' };
    }
    this.showModal.set(true);
  }

  async save(e: Event): Promise<void> {
    e.preventDefault();
    this.loading.set(true);
    try {
      const ed = this.editingUser();
      const payload = { ...this.formData, role: 'mapping' };
      if (ed) {
        await firstValueFrom(this.http.put(`/api/users/${ed._id}`, payload));
        this.successModal.set({ isOpen: true, title: 'User Updated', message: `${this.formData.name} updated.` });
      } else {
        const res = await firstValueFrom(this.http.post<{ mappingId?: string }>('/api/users', payload));
        this.successModal.set({
          isOpen: true,
          title: 'User Created',
          message: `${this.formData.name} created with Mapping ID: ${res.mappingId || ''}`,
        });
      }
      await this.fetch();
      this.showModal.set(false);
    } catch (e: unknown) {
      this.errorModal.set({
        isOpen: true,
        title: 'Error',
        message: (e as { error?: { message?: string } })?.error?.message || 'Save failed',
      });
    } finally {
      this.loading.set(false);
    }
  }

  async deleteUser(): Promise<void> {
    const d = this.deleteConfirm();
    if (!d.userId) return;
    try {
      await firstValueFrom(this.http.delete(`/api/users/${d.userId}`));
      this.successModal.set({ isOpen: true, title: 'Deleted', message: `${d.userName} deleted.` });
      await this.fetch();
    } catch (e: unknown) {
      this.errorModal.set({
        isOpen: true,
        title: 'Delete failed',
        message: (e as { error?: { message?: string } })?.error?.message || 'Unable to delete',
      });
    } finally {
      this.deleteConfirm.set({ isOpen: false, userId: null, userName: '' });
    }
  }

  async importCsv(e: Event): Promise<void> {
    e.preventDefault();
    const f = this.csvFile();
    if (!f) return;
    this.importing.set(true);
    this.importResult.set(null);
    const fd = new FormData();
    fd.append('csvFile', f);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success?: number; failed?: number; errors?: string[] }>('/api/users/import-mapping', fd),
      );
      this.importResult.set(res);
      await this.fetch();
      this.csvFile.set(null);
    } catch (e: unknown) {
      this.errorModal.set({
        isOpen: true,
        title: 'Import Failed',
        message: (e as { error?: { message?: string } })?.error?.message || 'Import failed',
      });
    } finally {
      this.importing.set(false);
    }
  }

  prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }
}
