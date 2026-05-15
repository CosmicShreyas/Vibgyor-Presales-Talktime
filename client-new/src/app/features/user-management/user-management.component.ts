import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EmployeeUser } from '../../models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

interface HrmsEmployee {
  employeeId: number;
  employeeCode: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
  departmentName?: string;
  designationName?: string;
  branchName?: string;
}

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
  readonly hrmsEmployees = signal<HrmsEmployee[]>([]);
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
      const [localUsers, hrmsEmployees] = await Promise.all([
        firstValueFrom(this.http.get<EmployeeUser[]>('/api/users')),
        firstValueFrom(this.http.get<HrmsEmployee[]>('/api/users/hrms-employees?departmentId=4')),
      ]);
      this.users.set(localUsers);
      this.hrmsEmployees.set(hrmsEmployees);
    } catch (e) {
      console.error(e);
    } finally {
      this.refreshing.set(false);
    }
  }

  mergedUsers(): EmployeeUser[] {
    const localUsers = this.users();
    const localByEmployeeId = new Map(localUsers.map((u) => [(u.employeeId || '').toUpperCase(), u]));
    const localByEmail = new Map(localUsers.map((u) => [u.email.toLowerCase(), u]));
    const merged: EmployeeUser[] = [];
    const seenLocalIds = new Set<string>();

    for (const hrms of this.hrmsEmployees()) {
      const employeeCode = (hrms.employeeCode || '').toUpperCase();
      const email = (hrms.email || '').toLowerCase();
      const localUser = localByEmployeeId.get(employeeCode) || localByEmail.get(email);

      if (localUser?._id) {
        seenLocalIds.add(localUser._id);
      }

      merged.push({
        _id: localUser?._id || `hrms-${employeeCode || hrms.employeeId}`,
        name: [hrms.firstName, hrms.lastName].filter(Boolean).join(' ').trim() || localUser?.name || 'Unnamed Employee',
        email: hrms.email || localUser?.email || '',
        role: localUser?.role || 'sales',
        isActive: hrms.isActive ?? localUser?.isActive ?? true,
        employeeId: employeeCode || localUser?.employeeId,
        mappingId: localUser?.mappingId,
        isSystemAdmin: localUser?.isSystemAdmin,
        phoneNumber: hrms.phoneNumber,
        departmentName: hrms.departmentName,
        designationName: hrms.designationName,
        branchName: hrms.branchName,
        employeeCode: hrms.employeeCode,
        hrmsEmployeeId: hrms.employeeId,
        isReadOnly: !localUser,
        source: localUser ? 'merged' : 'hrms',
      });
    }

    for (const localUser of localUsers) {
      if (seenLocalIds.has(localUser._id)) continue;
      merged.push({
        ...localUser,
        isReadOnly: false,
        source: 'local',
      });
    }

    return merged;
  }

  filteredUsers(): EmployeeUser[] {
    const q = this.searchQuery().toLowerCase();
    return this.mergedUsers().filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        (u.phoneNumber && u.phoneNumber.includes(this.searchQuery())) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q)) ||
        (u.designationName && u.designationName.toLowerCase().includes(q)) ||
        (u.branchName && u.branchName.toLowerCase().includes(q)),
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
