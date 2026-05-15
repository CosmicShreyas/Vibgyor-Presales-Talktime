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
  @Input({ required: true }) user: AuthUser | null = null;
  @Input({ required: true }) selectedIds: string[] = [];
  @Input({ required: true }) leadErrors: LeadErrorEntry[] = [];

  @Output() toggleGroup = new EventEmitter<string>();
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

  pageSlice(leads: Client[]): Client[] {
    return leads;
  }

  pageMeta(leads: Client[]): { start: number; totalPages: number } {
    return { start: 0, totalPages: 1 };
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
