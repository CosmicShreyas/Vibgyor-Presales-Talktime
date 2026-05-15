import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthUser, Client } from '../../models';
import { NativeCallService } from '../../core/native-call.service';
import {
  censorPhoneNumber,
  formatClientCreatedCell,
  formatStatusLabel,
  getLeadError,
  getLeadTablePriorityPillClass,
  getLeadTableStatusPillClass,
  hasLeadError,
  LeadErrorEntry,
} from '../../core/lead-ui';

@Component({
  selector: 'app-leads-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leads-table.component.html',
})
export class LeadsTableComponent {
  private readonly nativeCalls = inject(NativeCallService);

  @Input({ required: true }) clients: Client[] = [];
  @Input() serialStart = 0;
  @Input() user: AuthUser | null = null;
  @Input() selectedIds: string[] = [];
  @Input() leadErrors: LeadErrorEntry[] = [];
  /** When set, empty state copy reflects active search (legacy flat view). */
  @Input() searchQuery = '';
  @Output() toggleOne = new EventEmitter<string>();
  @Output() toggleAllPage = new EventEmitter<boolean>();
  @Output() edit = new EventEmitter<Client>();
  @Output() delete = new EventEmitter<Client>();

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  isAllPageSelected(): boolean {
    if (!this.clients.length) return false;
    return this.clients.every((c) => this.selectedIds.includes(c._id));
  }

  hasErr(id: string): boolean {
    return hasLeadError(this.leadErrors, id);
  }

  errInfo(id: string): LeadErrorEntry | undefined {
    return getLeadError(this.leadErrors, id);
  }

  phoneDisplay(phone: string): string {
    return censorPhoneNumber(phone || '', this.user?.role || '');
  }

  statusPill = getLeadTableStatusPillClass;
  priorityPill = getLeadTablePriorityPillClass;
  fsl = formatStatusLabel;
  fcd = formatClientCreatedCell;

  callLead(client: Client): void {
    this.nativeCalls.startCall(client);
  }
}
