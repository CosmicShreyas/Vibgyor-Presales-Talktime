import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthUser, Client, HierarchicalGroup, HierarchicalParentGroup } from '../../models';
import { LeadErrorEntry, getGroupInfo } from '../../core/lead-ui';
import { groupedSingleRowVisual, type GroupedSingleRowVisual } from '../../core/lead-group-row-styles';
import { LeadsTableComponent } from './leads-table.component';

@Component({
  selector: 'app-client-grouped-leads',
  standalone: true,
  imports: [CommonModule, LeadsTableComponent],
  templateUrl: './client-grouped-leads.component.html',
})
export class ClientGroupedLeadsComponent {
  @Input({ required: true }) sortedGroupKeys: string[] = [];
  @Input({ required: true }) hierarchicalGroups: Record<string, HierarchicalGroup> = {};
  @Input({ required: true }) expanded: Record<string, boolean> = {};
  @Input({ required: true }) groupPages: Record<string, number> = {};
  @Input({ required: true }) user: AuthUser | null = null;
  @Input({ required: true }) selectedIds: string[] = [];
  @Input({ required: true }) leadErrors: LeadErrorEntry[] = [];
  @Input() itemsPerPage = 20;

  @Output() toggleGroup = new EventEmitter<string>();
  @Output() setGroupPage = new EventEmitter<{ key: string; page: number }>();
  @Output() edit = new EventEmitter<Client>();
  @Output() delete = new EventEmitter<Client>();
  @Output() deleteSource = new EventEmitter<{ leads: Client[]; label: string }>();
  @Output() toggleOne = new EventEmitter<string>();
  @Output() toggleAllPage = new EventEmitter<boolean>();

  info = getGroupInfo;

  rowVisual(groupKey: string): GroupedSingleRowVisual {
    return groupedSingleRowVisual(groupKey);
  }

  isParent(g: HierarchicalGroup): g is HierarchicalParentGroup {
    return g.type === 'parent';
  }

  keys(obj: object): string[] {
    return Object.keys(obj || {});
  }

  isOpen(key: string): boolean {
    return !!this.expanded[key];
  }

  groupPage(key: string): number {
    return this.groupPages[key] || 1;
  }

  paginate(leads: Client[], key: string): { rows: Client[]; start: number; totalPages: number; page: number } {
    const totalPages = Math.max(1, Math.ceil(leads.length / this.itemsPerPage));
    const page = Math.min(Math.max(1, this.groupPage(key)), totalPages);
    const start = (page - 1) * this.itemsPerPage;
    return {
      rows: leads.slice(start, start + this.itemsPerPage),
      start,
      totalPages,
      page,
    };
  }

  parentTotal(g: HierarchicalParentGroup): number {
    return Object.values(g.subCategories).reduce((sum, sub) => {
      return sum + Object.values(sub.children).reduce((s, arr) => s + arr.length, 0);
    }, 0);
  }

  subTotal(sub: { children: Record<string, Client[]> }): number {
    return Object.values(sub.children).reduce((s, arr) => s + arr.length, 0);
  }
}
