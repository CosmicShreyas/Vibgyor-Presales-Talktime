import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Client } from '@/types';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

interface StatsBarProps {
  clients: Client[];
}

export function StatsBar({ clients }: StatsBarProps) {
  const total = clients.length;
  const done = clients.filter(c => c.status !== 'pending').length;
  const connected = clients.filter(c => c.status === 'connected').length;
  const pending = clients.filter(c => c.status === 'pending').length;
  const progress = total > 0 ? done / total : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatPill label="Total" value={total} color={Colors.textSecondary} />
        <StatPill label="Called" value={done} color={Colors.primary} />
        <StatPill label="Connected" value={connected} color={Colors.statusConnected} />
        <StatPill label="Pending" value={pending} color={Colors.statusNoAnswer} />
      </View>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{Math.round(progress * 100)}% of today's schedule complete</Text>
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pill: {
    alignItems: 'center',
    gap: 2,
  },
  pillValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
  pillLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
