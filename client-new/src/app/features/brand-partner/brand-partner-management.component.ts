import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { CsvImportDropzoneComponent } from '../../shared/csv-import-dropzone/csv-import-dropzone.component';

export interface BrandPartner {
  _id: string;
  partnerCode?: string;
  partnerName: string;
  nickName?: string;
  contactPerson1?: string;
  phoneNo1?: string;
  contactPerson2?: string;
  phoneNo2?: string;
  email?: string;
  address?: string;
  accountHolderName?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  pan?: string;
  panDocument?: string | null;
  ifscDocument?: string | null;
  remarks?: string;
  paymentTerms?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-brand-partner-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, CsvImportDropzoneComponent],
  templateUrl: './brand-partner-management.component.html',
})
export class BrandPartnerManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly partners = signal<BrandPartner[]>([]);
  readonly searchQuery = signal('');
  readonly showModal = signal(false);
  readonly showImport = signal(false);
  readonly showPw = signal(false);
  readonly loading = signal(false);
  readonly importing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly deleteConfirm = signal({ isOpen: false, id: '' as string | null });
  readonly notify = signal<{ open: boolean; title: string; message: string; type: string }>({
    open: false,
    title: '',
    message: '',
    type: 'success',
  });
  readonly errors = signal<Record<string, string>>({});
  readonly importCsvText = signal('');
  /** Shown on the CSV dropzone after a file is chosen */
  readonly importCsvDisplayName = signal<string | null>(null);

  form: Record<string, string | File | null> = {
    partnerName: '',
    nickName: '',
    contactPerson1: '',
    phoneNo1: '',
    contactPerson2: '',
    phoneNo2: '',
    email: '',
    password: '',
    address: '',
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    pan: '',
    panDocument: null,
    ifscDocument: null,
    remarks: '',
    paymentTerms: '',
  };

  ngOnInit(): void {
    void this.fetch();
  }

  async fetch(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<BrandPartner[]>('/api/brand-partners'));
      this.partners.set(Array.isArray(data) ? data : []);
    } catch {
      this.partners.set([]);
    }
  }

  filtered(): BrandPartner[] {
    const q = this.searchQuery().toLowerCase();
    return this
      .partners()
      .filter(
        (p) =>
          p.partnerName.toLowerCase().includes(q) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.phoneNo1 && p.phoneNo1.includes(q)),
      );
  }

  resetForm(): void {
    this.form = {
      partnerName: '',
      nickName: '',
      contactPerson1: '',
      phoneNo1: '',
      contactPerson2: '',
      phoneNo2: '',
      email: '',
      password: '',
      address: '',
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      pan: '',
      panDocument: null,
      ifscDocument: null,
      remarks: '',
      paymentTerms: '',
    };
    this.errors.set({});
    this.showPw.set(false);
    this.editingId.set(null);
  }

  openModal(p: BrandPartner | null): void {
    if (p) {
      this.editingId.set(p._id);
      this.form = {
        partnerName: p.partnerName || '',
        nickName: p.nickName || '',
        contactPerson1: p.contactPerson1 || '',
        phoneNo1: p.phoneNo1 || '',
        contactPerson2: p.contactPerson2 || '',
        phoneNo2: p.phoneNo2 || '',
        email: p.email || '',
        password: '',
        address: p.address || '',
        accountHolderName: p.accountHolderName || '',
        accountNumber: p.accountNumber || '',
        bankName: p.bankName || '',
        ifscCode: p.ifscCode || '',
        pan: p.pan || '',
        panDocument: null,
        ifscDocument: null,
        remarks: p.remarks || '',
        paymentTerms: p.paymentTerms || '',
      };
      this.errors.set({});
    } else this.resetForm();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  validate(): boolean {
    const f = this.form;
    const e: Record<string, string> = {};
    const partnerName = this.stringValue('partnerName');
    const contactPerson1 = this.stringValue('contactPerson1');
    const phoneNo1 = this.stringValue('phoneNo1');
    const phoneNo2 = this.stringValue('phoneNo2');
    const email = this.stringValue('email');
    const password = this.stringValue('password');
    const address = this.stringValue('address');
    const accountHolderName = this.stringValue('accountHolderName');
    const accountNumber = this.stringValue('accountNumber');
    const bankName = this.stringValue('bankName');
    const ifscCode = this.stringValue('ifscCode');
    const pan = this.stringValue('pan');

    if (!partnerName.trim()) e['partnerName'] = 'Required';
    if (!contactPerson1.trim()) e['contactPerson1'] = 'Required';
    if (!phoneNo1.trim()) e['phoneNo1'] = 'Required';
    else if (!/^[6-9]\d{9}$/.test(phoneNo1)) e['phoneNo1'] = '10-digit mobile';
    if (phoneNo2 && !/^[6-9]\d{9}$/.test(phoneNo2)) e['phoneNo2'] = 'Invalid mobile';
    if (!email.trim()) e['email'] = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e['email'] = 'Invalid email';
    if (!this.editingId() && (!password || password.length < 6)) e['password'] = 'Min 6 chars';
    if (this.editingId() && password && password.length < 6) e['password'] = 'Min 6 chars';
    if (!address.trim()) e['address'] = 'Required';
    if (!accountHolderName.trim()) e['accountHolderName'] = 'Required';
    if (!accountNumber.trim()) e['accountNumber'] = 'Required';
    if (!bankName.trim()) e['bankName'] = 'Required';
    if (!ifscCode.trim()) e['ifscCode'] = 'Required';
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode)) e['ifscCode'] = 'Invalid IFSC';
    if (!pan.trim()) e['pan'] = 'Required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan)) e['pan'] = 'Invalid PAN';
    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  async save(ev: Event): Promise<void> {
    ev.preventDefault();
    if (!this.validate()) return;
    this.loading.set(true);
    try {
      const body: Record<string, unknown> = { ...this.form };
      if (this.editingId() && !this.form['password']) delete body['password'];
      if (this.form['panDocument'] instanceof File) {
        body['panDocument'] = await this.fileToBase64(this.form['panDocument']);
      } else if (!this.form['panDocument']) {
        delete body['panDocument'];
      }
      if (this.form['ifscDocument'] instanceof File) {
        body['ifscDocument'] = await this.fileToBase64(this.form['ifscDocument']);
      } else if (!this.form['ifscDocument']) {
        delete body['ifscDocument'];
      }
      const id = this.editingId();
      if (id) {
        await firstValueFrom(this.http.put(`/api/brand-partners/${id}`, body));
        this.flash('Success', 'Partner updated', 'success');
      } else {
        await firstValueFrom(this.http.post('/api/brand-partners', body));
        this.flash('Success', 'Partner created', 'success');
      }
      await this.fetch();
      this.closeModal();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      this.flash('Error', e.error?.message || 'Save failed', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  requestDelete(p: BrandPartner): void {
    this.deleteConfirm.set({ isOpen: true, id: p._id });
  }

  async confirmDelete(): Promise<void> {
    const id = this.deleteConfirm().id;
    if (!id) return;
    try {
      await firstValueFrom(this.http.delete(`/api/brand-partners/${id}`));
      this.flash('Deleted', 'Brand partner removed', 'success');
      await this.fetch();
    } catch {
      this.flash('Error', 'Delete failed', 'error');
    } finally {
      this.deleteConfirm.set({ isOpen: false, id: null });
    }
  }

  flash(title: string, message: string, type: string): void {
    this.notify.set({ open: true, title, message, type });
    setTimeout(() => this.notify.update((n) => ({ ...n, open: false })), 3500);
  }

  async runBulkImport(): Promise<void> {
    const text = this.importCsvText().trim();
    if (!text) {
      this.flash('Error', 'Paste CSV content or use file', 'error');
      return;
    }
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      this.flash('Error', 'Invalid CSV', 'error');
      return;
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    const partners: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      partners.push({
        partnerName: row['Partner Name'] || '',
        nickName: row['Nick Name'] || '',
        contactPerson1: row['Contact Person 1'] || '',
        phoneNo1: row['Phone No 1'] || '',
        contactPerson2: row['Contact Person 2'] || '',
        phoneNo2: row['Phone No 2'] || '',
        email: row['Email'] || '',
        password: row['Password'] || '',
        address: row['Address'] || '',
        accountHolderName: row['Account Holder Name'] || '',
        accountNumber: row['Account Number'] || '',
        bankName: row['Bank Name'] || '',
        ifscCode: row['IFSC Code'] || '',
        pan: row['PAN'] || '',
        remarks: row['Remarks'] || '',
        paymentTerms: row['Payment Terms'] || '',
      });
    }
    this.importing.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ imported?: number; failed?: number; message?: string }>('/api/brand-partners/bulk-import', {
          partners,
        }),
      );
      const imp = res.imported ?? 0;
      const fail = res.failed ?? 0;
      this.flash('Import complete', fail > 0 ? `Imported ${imp}, ${fail} failed` : `Imported ${imp}`, fail > 0 ? 'warning' : 'success');
      await this.fetch();
      this.importCsvText.set('');
      this.importCsvDisplayName.set(null);
      this.showImport.set(false);
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      this.flash('Error', e.error?.message || 'Import failed', 'error');
    } finally {
      this.importing.set(false);
    }
  }

  loadBulkCsvFile(file: File | null): void {
    if (!file) {
      this.importCsvDisplayName.set(null);
      this.importCsvText.set('');
      return;
    }
    this.importCsvDisplayName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => this.importCsvText.set(String(reader.result || ''));
    reader.readAsText(file);
  }

  handleFileChange(field: 'panDocument' | 'ifscDocument', event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.form[field] = file;
  }

  toggleShowPw(): void {
    this.showPw.update((v) => !v);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private stringValue(field: string): string {
    const value = this.form[field];
    return typeof value === 'string' ? value : '';
  }
}
