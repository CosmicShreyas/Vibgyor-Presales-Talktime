/** Visual theme for single-type hierarchical lead groups (Manual, Mapping, CSV, …). */

export type SingleGroupIconKind = 'manual' | 'mapping' | 'facebook' | 'instagram' | 'csv' | 'default';

export interface GroupedSingleRowVisual {
  shell: string;
  header: string;
  badge: string;
  icon: SingleGroupIconKind;
  iconTint: string;
}

export function singleGroupIconKind(groupKey: string): SingleGroupIconKind {
  if (groupKey === 'manual') return 'manual';
  if (groupKey === 'mapping') return 'mapping';
  if (groupKey.startsWith('facebook-')) return 'facebook';
  if (groupKey.startsWith('instagram-')) return 'instagram';
  if (groupKey.startsWith('csv-')) return 'csv';
  return 'default';
}

export function groupedSingleRowVisual(groupKey: string): GroupedSingleRowVisual {
  const shellBase = 'border-2 rounded-lg overflow-hidden shadow-sm ';
  const headerBase =
    'w-full flex items-center justify-between gap-3 p-4 text-left transition-colors bg-gradient-to-r ';
  const badgeBase = 'text-sm font-semibold px-3 py-1 rounded-md shrink-0 ml-2 ';

  // Same blue / indigo treatment as the Databases parent rows (not purple).
  if (groupKey === 'manual') {
    return {
      shell: shellBase + 'border-blue-300 dark:border-blue-700',
      header:
        headerBase +
        'from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 active:from-blue-100 active:to-indigo-200 dark:from-blue-950 dark:to-indigo-950 dark:hover:from-blue-900 dark:hover:to-indigo-900 dark:active:from-blue-800 dark:active:to-indigo-800',
      badge: badgeBase + 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900',
      icon: 'manual',
      iconTint: 'text-blue-600 dark:text-blue-400',
    };
  }
  if (groupKey === 'mapping') {
    return {
      shell: shellBase + 'border-teal-400 dark:border-teal-600',
      header:
        headerBase +
        'from-teal-50 to-emerald-100 hover:from-teal-100 hover:to-emerald-100 dark:from-teal-950 dark:to-emerald-950 dark:hover:from-teal-900 dark:hover:to-emerald-900',
      badge: badgeBase + 'text-teal-900 bg-teal-100 dark:text-teal-100 dark:bg-teal-900',
      icon: 'mapping',
      iconTint: 'text-teal-600 dark:text-teal-400',
    };
  }
  if (groupKey.startsWith('facebook-')) {
    return {
      shell: shellBase + 'border-blue-400 dark:border-blue-500',
      header:
        headerBase +
        'from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950 dark:to-indigo-950 dark:hover:from-blue-900 dark:hover:to-indigo-900',
      badge: badgeBase + 'text-blue-900 bg-blue-100 dark:text-blue-100 dark:bg-blue-900',
      icon: 'facebook',
      iconTint: 'text-blue-600 dark:text-blue-400',
    };
  }
  if (groupKey.startsWith('instagram-')) {
    return {
      shell: shellBase + 'border-pink-400 dark:border-pink-500',
      header:
        headerBase +
        'from-pink-50 to-rose-100 hover:from-pink-100 hover:to-rose-100 dark:from-pink-950 dark:to-rose-950 dark:hover:from-pink-900 dark:hover:to-rose-900',
      badge: badgeBase + 'text-pink-900 bg-pink-100 dark:text-pink-100 dark:bg-pink-900',
      icon: 'instagram',
      iconTint: 'text-pink-600 dark:text-pink-400',
    };
  }
  if (groupKey.startsWith('csv-')) {
    return {
      shell: shellBase + 'border-amber-400 dark:border-amber-600',
      header:
        headerBase +
        'from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950 dark:to-orange-950 dark:hover:from-amber-900 dark:hover:to-orange-900',
      badge: badgeBase + 'text-amber-900 bg-amber-100 dark:text-amber-100 dark:bg-amber-900',
      icon: 'csv',
      iconTint: 'text-amber-600 dark:text-amber-400',
    };
  }
  return {
    shell: shellBase + 'border-slate-400 dark:border-slate-500',
    header:
      headerBase +
      'from-slate-50 to-gray-100 hover:from-slate-100 hover:to-gray-100 dark:from-slate-900 dark:to-slate-950 dark:hover:from-slate-800 dark:hover:to-slate-900',
    badge: badgeBase + 'text-slate-800 bg-slate-200 dark:text-slate-100 dark:bg-slate-700',
    icon: 'default',
    iconTint: 'text-slate-600 dark:text-slate-400',
  };
}
