// TalkTime Design System
export const Colors = {
  // Base
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#1C2230',
  border: '#21262D',
  borderLight: '#2D3748',

  // Brand
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryGlow: 'rgba(59, 130, 246, 0.15)',
  accent: '#06B6D4',

  // Text
  textPrimary: '#F0F6FF',
  textSecondary: '#8B949E',
  textMuted: '#484F58',

  // Status Colors
  statusConnected: '#10B981',
  statusConnectedBg: 'rgba(16, 185, 129, 0.12)',
  statusNoAnswer: '#F59E0B',
  statusNoAnswerBg: 'rgba(245, 158, 11, 0.12)',
  statusIgnored: '#8B5CF6',
  statusIgnoredBg: 'rgba(139, 92, 246, 0.12)',
  statusHold: '#3B82F6',
  statusHoldBg: 'rgba(59, 130, 246, 0.12)',
  statusCallback: '#06B6D4',
  statusCallbackBg: 'rgba(6, 182, 212, 0.12)',
  statusSwitchedOff: '#EF4444',
  statusSwitchedOffBg: 'rgba(239, 68, 68, 0.12)',
  statusBusy: '#F97316',
  statusBusyBg: 'rgba(249, 115, 22, 0.12)',
  statusWrongNumber: '#6B7280',
  statusWrongNumberBg: 'rgba(107, 114, 128, 0.12)',
  statusPending: '#374151',
  statusPendingBg: 'rgba(55, 65, 81, 0.12)',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  h4: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
  button: { fontSize: 15, fontWeight: '600' as const },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  glow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
