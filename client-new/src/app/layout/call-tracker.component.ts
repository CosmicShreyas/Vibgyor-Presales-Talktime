import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NativeCallService } from '../core/native-call.service';

@Component({
  selector: 'app-call-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './call-tracker.component.html',
})
export class CallTrackerComponent {
  readonly calls = inject(NativeCallService);

  status = 'follow-up';
  notes = '';

  readonly statusOptions = [
    'qualified',
    'not-interested',
    'follow-up',
    'no-response',
    'number-inactive',
    'number-switched-off',
    'on-hold',
    'no-requirement',
    'disqualified',
    'disconnected',
    'already-finalised',
  ];

  formatStatus(status: string): string {
    return status
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  async endCall(): Promise<void> {
    await this.calls.completeCall(this.status, this.notes);
    if (!this.calls.activeSession()) {
      this.notes = '';
      this.status = 'follow-up';
    }
  }

  cancelCall(): void {
    this.calls.cancelCall();
    this.notes = '';
    this.status = 'follow-up';
  }
}
