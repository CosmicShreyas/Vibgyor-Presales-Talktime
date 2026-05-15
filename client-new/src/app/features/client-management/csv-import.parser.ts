import { validatePhoneNumber } from '../../core/lead-ui';

export interface ParsedLeadRow {
  rowIndex: number;
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  company: string;
  tags: string;
  assignTo: string;
  address: string;
  city: string;
  state: string;
  description: string;
  source: string;
  budget: string;
  status: string;
  notes: string;
  hasPhoneError?: boolean;
  hasAltPhoneError?: boolean;
  phoneErrorMessage?: string;
  altPhoneErrorMessage?: string;
  hasAssignmentError?: boolean;
  assignmentErrorMessage?: string;
  isDuplicateInCSV?: boolean;
  isDuplicateAltInCSV?: boolean;
  isDuplicateInDB?: boolean;
  isDuplicateAltInDB?: boolean;
}

export function normalizeStatus(status: string): string {
  if (!status) return 'pending';
  const statusMap: Record<string, string> = {
    'yet to contact': 'pending',
    'no response': 'no-response',
    'not interested': 'not-interested',
    qualified: 'qualified',
    'number inactive': 'number-inactive',
    'number switched off': 'number-switched-off',
    'on hold': 'on-hold',
    'no requirement': 'no-requirement',
    'follow up': 'follow-up',
    disqualified: 'disqualified',
    disconnected: 'disconnected',
    'already finalised': 'already-finalised',
    'already finalized': 'already-finalised',
  };
  return statusMap[status.toLowerCase().trim()] || 'pending';
}

function parsePhoneCell(value: string): string {
  if (!value) return '';
  if (value.includes('E') || value.includes('e')) {
    try {
      return parseFloat(value).toFixed(0);
    } catch {
      return value;
    }
  }
  return value;
}

export interface ValidationRowError {
  rowIndex: number;
  lead: ParsedLeadRow;
  phoneError: string | null;
  altPhoneError: string | null;
  assignmentError: string | null;
}

export function parseCsvLeads(
  text: string,
  users: { name: string; email: string }[],
): { data: ParsedLeadRow[]; errors: ValidationRowError[] } {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return { data: [], errors: [] };
  const headers = lines[0].split(',').map((h) => h.trim());
  const data: ParsedLeadRow[] = [];
  const errors: ValidationRowError[] = [];
  const phoneNumbersInCsv = new Map<string, number>();

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    const lead: ParsedLeadRow = {
      rowIndex: i,
      name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
      phone: parsePhoneCell(row['Phone Number'] || ''),
      alternatePhone: parsePhoneCell(row['Alternate Phone Number'] || ''),
      email: row['Email'] || '',
      company: row['Project Name'] || '',
      tags: row['Tags'] || '',
      assignTo: row['Assign To'] || row['Assigned To'] || '',
      address: row['Address 2'] || '',
      city: row['City'] || '',
      state: row['State'] || '',
      description: row['Description'] || row['PR Name'] || '',
      source: row['Source'] || '',
      budget: row['Budget'] || '',
      status: normalizeStatus(row['Lead Status'] || 'pending'),
      notes: '',
    };

    const cleanedPhone = lead.phone.replace(/\D/g, '');
    const cleanedAlt = lead.alternatePhone ? lead.alternatePhone.replace(/\D/g, '') : '';
    if (cleanedPhone) {
      if (phoneNumbersInCsv.has(cleanedPhone)) lead.isDuplicateInCSV = true;
      else phoneNumbersInCsv.set(cleanedPhone, i);
    }
    if (cleanedAlt) {
      if (phoneNumbersInCsv.has(cleanedAlt)) lead.isDuplicateAltInCSV = true;
      else phoneNumbersInCsv.set(cleanedAlt, i);
    }

    const pv = validatePhoneNumber(lead.phone);
    const av = lead.alternatePhone ? validatePhoneNumber(lead.alternatePhone) : { valid: true };
    lead.hasPhoneError = !pv.valid;
    lead.hasAltPhoneError = !av.valid;
    lead.phoneErrorMessage = pv.message || '';
    lead.altPhoneErrorMessage = (av as { message?: string }).message || '';

    let hasAssignmentError = false;
    let assignmentErrorMessage = '';
    if (lead.assignTo) {
      const ok = users.some(
        (u) =>
          u.name.toLowerCase().includes(lead.assignTo.toLowerCase()) ||
          lead.assignTo.toLowerCase().includes(u.name.toLowerCase()),
      );
      if (!ok) {
        hasAssignmentError = true;
        assignmentErrorMessage = `Employee "${lead.assignTo}" not found`;
      }
    }
    lead.hasAssignmentError = hasAssignmentError;
    lead.assignmentErrorMessage = assignmentErrorMessage;

    if (!pv.valid || !av.valid || hasAssignmentError) {
      errors.push({
        rowIndex: i,
        lead,
        phoneError: !pv.valid ? pv.message || null : null,
        altPhoneError: !av.valid ? (av as { message?: string }).message || null : null,
        assignmentError: hasAssignmentError ? assignmentErrorMessage : null,
      });
    }
    data.push(lead);
  }
  return { data, errors };
}
