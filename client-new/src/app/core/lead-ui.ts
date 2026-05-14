import { AuthUser, Client } from '../models';

export function censorPhoneNumber(phone: string, userRole: string): string {
  if (userRole === 'admin') return phone || '';
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  const lastFour = digits.slice(-4);
  const censoredPart = '*'.repeat(digits.length - 4);
  if (phone.includes('-')) return `${censoredPart.slice(0, -4)}****-${lastFour}`;
  if (phone.includes(' ')) return `${censoredPart} ${lastFour}`;
  return `${censoredPart}${lastFour}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
    'no-response': 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
    'not-interested': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
    qualified: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    'number-inactive': 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200',
    'number-switched-off': 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200',
    'on-hold': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
    'no-requirement': 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
    'follow-up': 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
    disqualified: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
    disconnected: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
    'already-finalised': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    contacted: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
    interested: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    closed: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
  };
  return colors[status] || colors['pending'];
}

/** Text-only status styling (leads flat table / legacy dashboard look — no pill background). */
export function getStatusTextClass(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-amber-600 dark:text-amber-400',
    'no-response': 'text-gray-600 dark:text-gray-300',
    'not-interested': 'text-red-600 dark:text-red-400',
    qualified: 'text-green-600 dark:text-green-400',
    'number-inactive': 'text-orange-600 dark:text-orange-400',
    'number-switched-off': 'text-orange-600 dark:text-orange-400',
    'on-hold': 'text-blue-600 dark:text-blue-400',
    'no-requirement': 'text-gray-600 dark:text-gray-300',
    'follow-up': 'text-purple-600 dark:text-purple-400',
    disqualified: 'text-red-600 dark:text-red-400',
    disconnected: 'text-red-600 dark:text-red-400',
    'already-finalised': 'text-green-600 dark:text-green-400',
    contacted: 'text-blue-600 dark:text-blue-400',
    interested: 'text-green-600 dark:text-green-400',
    closed: 'text-gray-600 dark:text-gray-300',
  };
  return colors[status] || colors['pending'];
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-gray-600 dark:text-gray-400 font-medium',
    medium:
      'border border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-transparent font-medium rounded-md px-2 py-0.5',
    high: 'text-red-600 dark:text-red-400 font-medium',
  };
  return colors[priority] || colors['medium'];
}

/** Status pill for All Leads flat table (dark dashboard row). */
export function getLeadTableStatusPillClass(status: string | undefined): string {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ';
  const s = status || 'pending';
  const map: Record<string, string> = {
    pending: base + 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/35',
    'no-response': base + 'bg-slate-700 text-slate-200 ring-1 ring-slate-500/45',
    'not-interested': base + 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
    qualified: base + 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35',
    'number-inactive': base + 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/35',
    'number-switched-off': base + 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/35',
    'on-hold': base + 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/35',
    'no-requirement': base + 'bg-slate-700 text-slate-200 ring-1 ring-slate-500/45',
    'follow-up': base + 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/45',
    disqualified: base + 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
    disconnected: base + 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
    'already-finalised': base + 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35',
    contacted: base + 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/35',
    interested: base + 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35',
    closed: base + 'bg-slate-700 text-slate-200 ring-1 ring-slate-500/45',
  };
  return map[s] || map['pending'];
}

/** Priority pill for All Leads flat table (dark dashboard row). */
export function getLeadTablePriorityPillClass(priority: string | undefined): string {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium lowercase ';
  const p = priority || 'medium';
  if (p === 'high') return base + 'bg-red-950/80 text-red-300 ring-1 ring-red-700/45';
  if (p === 'low') return base + 'bg-slate-700 text-slate-300 ring-1 ring-slate-500/45';
  return base + 'bg-blue-950 text-blue-300 ring-1 ring-blue-700/50';
}

export function formatStatusLabel(status: string | undefined): string {
  if (!status) return 'Unknown';
  return status
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatClientCreatedCell(client: Client): { main: string; sub: string } {
  if (client.importMethod === 'csv' && client.importedAt) {
    return {
      main: new Date(client.importedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      sub: 'CSV Import',
    };
  }
  const sub =
    client.importMethod === 'facebook'
      ? 'Facebook'
      : client.importMethod === 'instagram'
        ? 'Instagram'
        : client.importMethod === 'mapping'
          ? 'Mapping'
          : 'Manual';
  return {
    main: client.createdAt
      ? new Date(client.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'N/A',
    sub,
  };
}

export function validatePhoneNumber(phone: string): { valid: boolean; message?: string } {
  if (!phone) return { valid: false, message: 'Phone number is required' };
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return { valid: false, message: `Too short (${cleaned.length} digits)` };
  if (cleaned.length > 11) return { valid: false, message: `Too long (${cleaned.length} digits)` };
  if (cleaned.length === 11) {
    if (cleaned.startsWith('080')) return { valid: true };
    return { valid: false, message: `Invalid 11-digit number (must start with 080)` };
  }
  return { valid: true };
}

export interface LeadErrorEntry {
  id: string;
  name: string;
  phone: string;
  hasPhoneError?: boolean;
  phoneErrorMessage?: string;
  hasAltPhoneError?: boolean;
  altPhoneErrorMessage?: string;
}

export function hasLeadError(leadsWithErrors: LeadErrorEntry[], clientId: string): boolean {
  return leadsWithErrors.some((l) => l.id === clientId);
}

export function getLeadError(leadsWithErrors: LeadErrorEntry[], clientId: string): LeadErrorEntry | undefined {
  return leadsWithErrors.find((l) => l.id === clientId);
}

export function getGroupInfo(groupKey: string): { type: string; name: string; id: string | null } {
  if (groupKey.startsWith('csv-')) {
    const withoutPrefix = groupKey.replace('csv-', '');
    const csvIdIndex = withoutPrefix.lastIndexOf('CSV-');
    if (csvIdIndex !== -1) {
      return {
        type: 'CSV Import',
        name: withoutPrefix.substring(0, csvIdIndex - 1),
        id: withoutPrefix.substring(csvIdIndex),
      };
    }
    return { type: 'CSV Import', name: withoutPrefix, id: null };
  }
  if (groupKey.startsWith('facebook-campaign-')) {
    const parts = groupKey.split('-');
    return { type: 'Facebook', name: parts.slice(3).join('-'), id: parts[2] };
  }
  if (groupKey.startsWith('instagram-campaign-')) {
    const parts = groupKey.split('-');
    return { type: 'Instagram', name: parts.slice(3).join('-'), id: parts[2] };
  }
  if (groupKey.startsWith('bp-')) return { type: 'Brand Partner', name: groupKey, id: null };
  if (groupKey === 'manual') return { type: 'Manual', name: 'Manually Added', id: null };
  if (groupKey === 'mapping') return { type: 'Mapping', name: 'Mapping Source', id: null };
  return { type: 'Other', name: groupKey, id: null };
}
