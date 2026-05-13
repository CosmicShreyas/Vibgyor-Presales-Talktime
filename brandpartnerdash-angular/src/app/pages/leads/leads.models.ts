export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'Yet to contact' | 'Follow-up' | 'Qualified' | 'Won' | 'Lost' | 'Disqualified';

export type Lead = {
  id: string;
  name: string;
  phone: string;
  altPhone: string;
  email: string;
  project: string;
  address: string;
  city: string;
  state: string;
  budget: string;
  priority: Priority;
  remarks: string;
  status: Status;
  createdAt: string;
  createdAtRaw: string;
};

export type LeadDraft = Omit<Lead, 'id' | 'createdAt' | 'createdAtRaw' | 'status'>;
export type LeadErrors = Partial<Record<keyof Lead, string>>;

export const STATUS_STYLES: Record<Status, string> = {
  'Yet to contact': 'bg-muted text-muted-foreground',
  'Follow-up': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Qualified: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  Won: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Lost: 'bg-red-500/15 text-red-600 dark:text-red-400',
  Disqualified: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  Low: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
  Medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  High: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

export const FILTERS: Array<'All' | Status> = ['All', 'Yet to contact', 'Follow-up', 'Qualified', 'Disqualified'];

export const EMPTY_DRAFT: LeadDraft = {
  name: '',
  phone: '',
  altPhone: '',
  email: '',
  project: '',
  address: '',
  city: '',
  state: '',
  budget: '',
  priority: 'Medium',
  remarks: '',
};

const PHONE_RE = /^[6-9]\d{9,10}$/;

export function validatePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return PHONE_RE.test(digits) ? '' : 'Enter a valid 10–11 digit mobile number';
}

export function validateDraft(draft: LeadDraft): LeadErrors {
  const errors: LeadErrors = {};
  if (!draft.name.trim()) errors.name = 'Required';
  if (!draft.phone.trim()) errors.phone = 'Required';
  else {
    const phoneError = validatePhone(draft.phone);
    if (phoneError) errors.phone = phoneError;
  }
  if (draft.altPhone.trim()) {
    const altError = validatePhone(draft.altPhone);
    if (altError) errors.altPhone = altError;
  }
  if (!draft.project.trim()) errors.project = 'Required';
  if (!draft.address.trim()) errors.address = 'Required';
  if (!draft.city.trim()) errors.city = 'Required';
  if (!draft.state.trim()) errors.state = 'Required';
  if (!draft.budget.trim()) errors.budget = 'Required';
  else if (!/^\d+(\.\d+)?$/.test(draft.budget.trim())) errors.budget = 'Must be a number';
  if (!draft.email.trim()) errors.email = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = 'Enter a valid email';
  return errors;
}

export function mapStatus(status: string): Status | null {
  const map: Record<string, Status> = {
    pending: 'Yet to contact',
    contacted: 'Follow-up',
    'follow-up': 'Follow-up',
    followup: 'Follow-up',
    qualified: 'Qualified',
    disqualified: 'Disqualified',
  };
  return map[status.toLowerCase()] ?? null;
}

export function mapApiLead(lead: {
  name: string;
  uniqueId: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city: string;
  state: string;
  project: string;
  budget: string;
  priority: string;
  status: string;
  createdAt: string;
}): Lead | null {
  const status = mapStatus(lead.status);
  if (!status) return null;
  return {
    id: lead.uniqueId,
    name: lead.name,
    phone: lead.phone ?? '',
    altPhone: lead.alternatePhone ?? '',
    email: lead.email ?? '',
    project: lead.project === 'N/A' ? '' : lead.project,
    address: lead.address === 'N/A' ? '' : (lead.address ?? ''),
    city: lead.city === 'N/A' ? '' : lead.city,
    state: lead.state === 'N/A' ? '' : lead.state,
    budget: lead.budget === 'N/A' ? '' : lead.budget,
    priority: (lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)) as Priority,
    remarks: '',
    status,
    createdAt: new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    createdAtRaw: lead.createdAt,
  };
}
