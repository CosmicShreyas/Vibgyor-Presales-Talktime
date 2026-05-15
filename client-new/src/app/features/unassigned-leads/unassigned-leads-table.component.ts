import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Client } from '../../models';

@Component({
  selector: 'app-unassigned-leads-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unassigned-leads-table.component.html',
})
export class UnassignedLeadsTableComponent {
  @Input({ required: true }) leads: Client[] = [];
  @Input() startIndex = 0;
  readonly deleteLead = output<string>();

  importedLabel(lead: Client): string {
    if (lead.importedAt) {
      return new Date(lead.importedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (lead.createdAt) {
      return new Date(lead.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return 'N/A';
  }
}
