import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EmployeeUser } from '../../models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './user-management.component.html',
})
export class UserManagementComponent {
  private readonly http = inject(HttpClient);
  readonly statsChanged = output<void>();

  readonly users = signal<EmployeeUser[]>([]);
  readonly showModal = signal(false);
  readonly editingUser = signal<EmployeeUser | null>(null);
  readonly deleteConfirm = signal({ isOpen: false, userId: '' as string | null, userName: '' });
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly itemsPerPage = 20;
  readonly refreshing = signal(false);
  readonly loading = signal(false);

  formData = { employeeId: '', name: '', email: '', password: '', role: 'sales', isActive: true };

  constructor() {
    void this.fetchUsers();
  }

  async fetchUsers(): Promise<void> {
    this.refreshing.set(true);
    try {
      const res = await firstValueFrom(this.http.get<EmployeeUser[]>('/api/users'));
      this.users.set(res);
    } catch (e) {
      console.error(e);
    } finally {
      this.refreshing.set(false);
    }
  }

  filteredUsers(): EmployeeUser[] {
    const q = this.searchQuery().toLowerCase();
    return this.users().filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q),
    );
  }

  paginatedUsers(): EmployeeUser[] {
    const f = this.filteredUsers();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return f.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers().length / this.itemsPerPage));
  }

  openModal(user: EmployeeUser | null = null): void {
    if (user) {
      this.editingUser.set(user);
      this.formData = {
        employeeId: user.employeeId || '',
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.isActive !== false,
      };
    } else {
      this.editingUser.set(null);
      this.formData = { employeeId: '', name: '', email: '', password: '', role: 'sales', isActive: true };
    }
    this.showModal.set(true);
  }

  async saveUser(e: Event): Promise<void> {
    e.preventDefault();
    this.loading.set(true);
    try {
      const ed = this.editingUser();
      if (ed) {
        await firstValueFrom(this.http.put(`/api/users/${ed._id}`, this.formData));
      } else {
        await firstValueFrom(this.http.post('/api/users', this.formData));
      }
      await this.fetchUsers();
      this.statsChanged.emit();
      this.showModal.set(false);
    } catch (err) {
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteUser(): Promise<void> {
    const d = this.deleteConfirm();
    if (!d.userId) return;
    try {
      await firstValueFrom(this.http.delete(`/api/users/${d.userId}`));
      await this.fetchUsers();
      this.statsChanged.emit();
    } catch (e) {
      console.error(e);
    } finally {
      this.deleteConfirm.set({ isOpen: false, userId: null, userName: '' });
    }
  }

  onSearchChange(): void {
    this.currentPage.set(1);
  }

  prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }
}
