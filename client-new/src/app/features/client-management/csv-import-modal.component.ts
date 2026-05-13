import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EmployeeUser } from '../../models';
import { parseCsvLeads, ParsedLeadRow, ValidationRowError } from './csv-import.parser';

@Component({
  selector: 'app-csv-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './csv-import-modal.component.html',
})
export class CsvImportModalComponent {
  private readonly http = inject(HttpClient);
  @Input() isOpen = false;
  @Input() users: EmployeeUser[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() imported = new EventEmitter<{ leads: ParsedLeadRow[]; fileName: string }>();

  readonly parsedData = signal<ParsedLeadRow[]>([]);
  readonly validationErrors = signal<ValidationRowError[]>([]);
  readonly checkingDup = signal(false);
  readonly fileName = signal('');
  readonly showValidation = signal(false);

  close(): void {
    this.parsedData.set([]);
    this.validationErrors.set([]);
    this.showValidation.set(false);
    this.fileName.set('');
    this.closed.emit();
  }

  async onFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fileName.set(file.name);
    const text = await file.text();
    const { data, errors } = parseCsvLeads(text, this.users);
    this.parsedData.set(data);
    this.validationErrors.set(errors);
    await this.checkDbDup(data);
    if (errors.length > 0) this.showValidation.set(true);
    input.value = '';
  }

  async checkDbDup(leads: ParsedLeadRow[]): Promise<void> {
    this.checkingDup.set(true);
    try {
      const phones: string[] = [];
      leads.forEach((l) => {
        if (l.phone) phones.push(l.phone.replace(/\D/g, ''));
        if (l.alternatePhone) phones.push(l.alternatePhone.replace(/\D/g, ''));
      });
      const existing = await firstValueFrom(
        this.http.post<string[]>('/api/clients/check-duplicates', { phoneNumbers: phones }),
      );
      const set = new Set((Array.isArray(existing) ? existing : []).map((p) => p.replace(/\D/g, '')));
      const data = [...leads];
      data.forEach((lead) => {
        const cp = lead.phone.replace(/\D/g, '');
        const ca = lead.alternatePhone ? lead.alternatePhone.replace(/\D/g, '') : '';
        if (cp && set.has(cp)) lead.isDuplicateInDB = true;
        if (ca && set.has(ca)) lead.isDuplicateAltInDB = true;
      });
      this.parsedData.set(data);
    } catch {
      /* ignore */
    } finally {
      this.checkingDup.set(false);
    }
  }

  importValid(): void {
    const leads = this.parsedData().filter(
      (l) =>
        !this.validationErrors().some((e) => e.rowIndex === l.rowIndex) && !l.isDuplicateInDB && !l.isDuplicateAltInDB,
    );
    this.imported.emit({ leads, fileName: this.fileName() });
    this.close();
  }

  importAnyway(): void {
    const leads = this.parsedData().filter((l) => !l.isDuplicateInDB && !l.isDuplicateAltInDB);
    this.imported.emit({ leads, fileName: this.fileName() });
    this.close();
  }
}
