import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useCalls } from '@/hooks/useCalls';
import { CallRecord } from '@/types';
import { PhoneService } from '@/services/phoneService';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { getStatusColor } from '@/services/mockData';

const OUTCOME_ICONS: Record<string, string> = {
  pending: 'schedule',
  'no-response': 'phone-missed',
  'not-interested': 'thumb-down',
  qualified: 'check-circle',
  'number-inactive': 'phone-disabled',
  'number-switched-off': 'phone-locked',
  'on-hold': 'pause-circle-filled',
  'no-requirement': 'cancel',
  'follow-up': 'schedule',
  disqualified: 'block',
  disconnected: 'phone-disabled',
  'already-finalised': 'done-all',
};

function SummaryChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '15', borderColor: color + '30' }]}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={[styles.chipCount, { color }]}>{count}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { employee } = useAuth();
  const { callHistory, isLoading, fetchHistory } = useCalls();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (employee) fetchHistory(employee.id);
  }, [employee]);

  // Build summary stats
  const stats = callHistory.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = activeFilter === 'all'
    ? callHistory
    : callHistory.filter(r => r.status === activeFilter);

  // Group by date
  const dateMap: Record<string, CallRecord[]> = {};
  filtered.forEach(r => {
    if (!dateMap[r.date]) dateMap[r.date] = [];
    dateMap[r.date].push(r);
  });
  const sections = Object.keys(dateMap)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({ title: date, data: dateMap[date] }));

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'follow-up', label: 'Follow Up' },
    { key: 'no-response', label: 'No Response' },
    { key: 'not-interested', label: 'Not Interested' },
  ];

  const renderRecord = useCallback(({ item, index }: { item: CallRecord; index: number }) => {
    const initials = item.clientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const statusColor = getStatusColor(item.status);
    const iconName = OUTCOME_ICONS[item.status] || 'phone';

    return (
      <Animated.View entering={FadeInDown.delay(index * 35).duration(280)}>
        <View style={styles.card}>
          {/* Left timeline line + dot */}
          <View style={styles.timeline}>
            <View style={[styles.timelineDot, { backgroundColor: statusColor }]} />
            <View style={styles.timelineLine} />
          </View>

          {/* Card body */}
          <View style={styles.cardBody}>
            {/* Top row */}
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={styles.clientName} numberOfLines={1}>{item.clientName}</Text>
                <Text style={styles.company} numberOfLines={1}>{item.company}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.timeText}>{item.time}</Text>
                <View style={[styles.outcomeIcon, { backgroundColor: statusColor + '18' }]}>
                  <MaterialIcons name={iconName as any} size={14} color={statusColor} />
                </View>
              </View>
            </View>

            {/* Status badge */}
            <View style={styles.badgeRow}>
              <StatusBadge status={item.status} size="sm" />
              {item.callDuration ? (
                <View style={styles.durationPill}>
                  <MaterialIcons name="timer" size={11} color={Colors.accent} />
                  <Text style={styles.durationText}>{PhoneService.formatDuration(item.callDuration)}</Text>
                </View>
              ) : null}
              {item.callbackDate ? (
                <View style={styles.callbackPill}>
                  <MaterialIcons name="event" size={11} color="#F59E0B" />
                  <Text style={styles.callbackText}>{item.callbackDate}</Text>
                </View>
              ) : null}
            </View>

            {/* Notes */}
            {item.notes ? (
              <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
            ) : null}
          </View>
        </View>
      </Animated.View>
    );
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Call History"
        subtitle={`${callHistory.length} records`}
      />

      {/* Filter bar */}
      <View style={styles.filterWrap}>
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => employee && fetchHistory(employee.id)}
            tintColor={Colors.primary}
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <View style={styles.sectionDateWrap}>
              <MaterialIcons name="calendar-today" size={11} color={Colors.textMuted} />
              <Text style={styles.sectionDate}>{section.title}</Text>
            </View>
            <View style={styles.sectionLine} />
          </View>
        )}
        renderItem={renderRecord}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="history" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Records Yet</Text>
            <Text style={styles.emptySubtitle}>Completed calls will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  filterWrap: {
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  timeline: {
    alignItems: 'center',
    width: 16,
    paddingTop: 4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  cardBody: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    gap: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  clientName: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  company: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  timeText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  outcomeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.22)',
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.accent,
  },
  callbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
  },
  callbackText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  notes: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { ...Typography.h4, color: Colors.textSecondary },
  emptySubtitle: { ...Typography.bodySmall, color: Colors.textMuted },
});
