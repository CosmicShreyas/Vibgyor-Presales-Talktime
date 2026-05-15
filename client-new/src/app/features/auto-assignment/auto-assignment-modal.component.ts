import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EmployeeUser, ProjectSource } from '../../models';

interface SourceAssignment {
  sourceName: string;
  assignedTo: string;
}

interface CsvFileAssignment {
  csvFileName: string;
  assignedTo: string;
}

interface AutoAssignmentSettings {
  excludedEmployees: { _id: string; name?: string }[];
  sourceAssignments?: { sourceName: string; assignedTo: string | { _id: string } }[];
  csvFileAssignments?: { csvFileName: string; assignedTo: string | { _id: string } }[];
}

@Component({
  selector: 'app-auto-assignment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auto-assignment-modal.component.html',
})
export class AutoAssignmentModalComponent implements OnChanges {
  private readonly http = inject(HttpClient);

  @Input() isOpen = false;
  @Input() users: EmployeeUser[] = [];
  @Input() projectSources: ProjectSource[] = [];
  @Output() closed = new EventEmitter<void>();
  /** Emitted after successful process-unassigned so parent can refresh stats */
  @Output() processed = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly excludedIds = signal<string[]>([]);
  readonly sourceAssignments = signal<SourceAssignment[]>([]);
  readonly csvFileAssignments = signal<CsvFileAssignment[]>([]);
  readonly csvFiles = signal<string[]>([]);
  readonly resultOpen = signal(false);
  readonly result = signal<{ type: 'success' | 'error'; title: string; message: string }>({
    type: 'success',
    title: '',
    message: '',
  });

  close(): void {
    this.resultOpen.set(false);
    this.closed.emit();
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['isOpen']?.currentValue === true) {
      void this.load();
    }
  }

  private resolveAssigneeId(v: string | { _id: string } | undefined): string {
    if (!v) return '';
    return typeof v === 'string' ? v : v._id;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const settings = await firstValueFrom(this.http.get<AutoAssignmentSettings>('/api/auto-assignment'));
      this.excludedIds.set((settings.excludedEmployees || []).map((e) => e._id));
      this.sourceAssignments.set(
        (settings.sourceAssignments || []).map((sa) => ({
          sourceName: sa.sourceName,
          assignedTo: this.resolveAssigneeId(sa.assignedTo),
        })),
      );
      this.csvFileAssignments.set(
        (settings.csvFileAssignments || []).map((ca) => ({
          csvFileName: ca.csvFileName,
          assignedTo: this.resolveAssigneeId(ca.assignedTo),
        })),
      );
      const files = await firstValueFrom(this.http.get<string[]>('/api/auto-assignment/csv-files'));
      this.csvFiles.set(Array.isArray(files) ? files : []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  toggleExcluded(id: string): void {
    const cur = this.excludedIds();
    if (cur.includes(id)) this.excludedIds.set(cur.filter((x) => x !== id));
    else this.excludedIds.set([...cur, id]);
  }

  /** Same as legacy modal: sales/mapping + active only. */
  eligibleUsers(): EmployeeUser[] {
    return (this.users || []).filter((u) => (u.role === 'sales' || u.role === 'mapping') && u.isActive);
  }

  /** Subtitle under source name when API description is empty. */
  sourceSubtitle(s: ProjectSource): string {
    const d = (s.description || '').trim();
    if (d) return d;
    const defaults: Record<string, string> = {
      'CSV Imports': 'Automatically created for CSV imported leads',
      Mapping: 'Leads from Mapping source',
    };
    return defaults[s.name] || '';
  }

  isExcluded(id: string): boolean {
    return this.excludedIds().includes(id);
  }

  getSourceAssign(sourceName: string): string {
    return this.sourceAssignments().find((s) => s.sourceName === sourceName)?.assignedTo || '';
  }

  setSourceAssign(sourceName: string, employeeId: string): void {
    const prev = this.sourceAssignments().filter((s) => s.sourceName !== sourceName);
    if (employeeId) prev.push({ sourceName, assignedTo: employeeId });
    this.sourceAssignments.set(prev);
  }

  getCsvAssign(fileName: string): string {
    return this.csvFileAssignments().find((c) => c.csvFileName === fileName)?.assignedTo || '';
  }

  setCsvAssign(fileName: string, employeeId: string): void {
    const prev = this.csvFileAssignments().filter((c) => c.csvFileName !== fileName);
    if (employeeId) prev.push({ csvFileName: fileName, assignedTo: employeeId });
    this.csvFileAssignments.set(prev);
  }

  private payload() {
    return {
      excludedEmployees: this.excludedIds(),
      sourceAssignments: this.sourceAssignments(),
      csvFileAssignments: this.csvFileAssignments(),
    };
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await firstValueFrom(this.http.put('/api/auto-assignment', this.payload()));
      this.result.set({ type: 'success', title: 'Settings Saved', message: 'Auto-assignment settings have been saved successfully.' });
      this.resultOpen.set(true);
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.result.set({
        type: 'error',
        title: 'Save Failed',
        message: err.error?.message || 'Failed to save settings.',
      });
      this.resultOpen.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  async saveAndProcess(): Promise<void> {
    this.saving.set(true);
    try {
      await firstValueFrom(this.http.put('/api/auto-assignment', this.payload()));
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; assignedCount?: number; failedCount?: number }>(
          '/api/auto-assignment/process-unassigned',
          {},
        ),
      );
      if (res.success) {
        const a = res.assignedCount ?? 0;
        const f = res.failedCount ?? 0;
        const message =
          f > 0 ? `Assigned ${a} lead(s). ${f} failed.` : `Successfully assigned ${a} lead(s).`;
        this.result.set({ type: 'success', title: 'Processing Complete', message });
        this.resultOpen.set(true);
        this.processed.emit();
      } else {
        this.result.set({ type: 'error', title: 'No Leads to Process', message: 'No unassigned leads found to process.' });
        this.resultOpen.set(true);
      }
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.result.set({
        type: 'error',
        title: 'Processing Failed',
        message: err.error?.message || 'Failed to process.',
      });
      this.resultOpen.set(true);
    } finally {
      this.saving.set(false);
    }
  }
}
