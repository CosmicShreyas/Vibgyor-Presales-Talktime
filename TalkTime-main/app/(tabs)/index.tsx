import React, { useEffect, useState, useCallback } from 'react';
import { Redirect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useCalls } from '@/hooks/useCalls';
import { useAlert } from '@/template';
import { Client } from '@/types';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { ClientCard } from '@/components/feature/ClientCard';
import { UpdateStatusSheet } from '@/components/feature/UpdateStatusSheet';
import { StatsBar } from '@/components/feature/StatsBar';
import { phoneService } from '@/services/phoneService';
import { LeadInfoSheet } from '@/components/feature/LeadInfoSheet';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'connected', label: 'Connected' },
  { key: 'no_answer', label: 'No Answer' },
  { key: 'callback', label: 'Callback' },
];

export default function TodayCallsScreen() {
  const { employee } = useAuth();
  const { clients, isLoading, isUpdating, fetchTodayCalls, updateClientStatus } = useCalls();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  if (employee?.role === 'mapping') return <Redirect href="/(tabs)/mapping" />;

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [trackedDuration, setTrackedDuration] = useState<number | undefined>(undefined);
  const [infoClient, setInfoClient] = useState<Client | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    if (employee) {
      fetchTodayCalls(employee.id);
    }
  }, [employee]);

  // Cleanup phone tracker on unmount
  useEffect(() => {
    return () => {
      phoneService.stopTracking();
    };
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const filtered = clients.filter(c => {
    const matchSearch =
      search.trim() === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const handleInfoPress = useCallback((client: Client) => {
    setInfoClient(client);
    setInfoVisible(true);
  }, []);

  // Open update sheet (manual — no call tracking)
  const handleCardPress = useCallback((client: Client) => {
    setTrackedDuration(undefined);
    setSelectedClient(client);
    setSheetVisible(true);
  }, []);

  // Initiate a real phone call, track duration, then open update sheet
  const handleCallPress = useCallback(async (client: Client) => {
    setSelectedClient(client);
    setTrackedDuration(undefined);

    const result = await phoneService.initiateCall(client.phone, (durationSeconds) => {
      setTrackedDuration(durationSeconds);
      setSheetVisible(true);
    });

    if (!result.success) {
      showAlert('Cannot Make Call', result.error || 'Unable to initiate call.');
    }
  }, []);

  const handleUpdate = async (status: string, notes: string, callbackDate?: string, callDuration?: number) => {
    if (!employee || !selectedClient) return;
    const success = await updateClientStatus(employee.id, {
      clientId: selectedClient.id,
      status,
      notes,
      callbackDate,
      callDuration,
    });
    if (success) {
      setSheetVisible(false);
      setTrackedDuration(undefined);
      const durationStr = callDuration ? ` · ${callDuration < 60 ? `${callDuration}s` : `${Math.floor(callDuration / 60)}m ${callDuration % 60}s`}` : '';
      showAlert('Updated', `${selectedClient.name}'s status has been saved.${durationStr}`);
    } else {
      showAlert('Error', 'Failed to update. Please try again.');
    }
  };

  const renderItem = useCallback(({ item, index }: { item: Client; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <ClientCard
        client={item}
        index={index}
        onPress={handleCardPress}
        onCallPress={handleCallPress}
        onInfoPress={handleInfoPress}
      />
    </Animated.View>
  ), [handleCardPress, handleCallPress]);

  const keyExtractor = useCallback((item: Client) => item.id, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning, {employee?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>{employee?.employeeId || employee?.mappingId || 'N/A'}</Text>
        </View>
      </View>

      {/* Stats */}
      <StatsBar clients={clients} />

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              onPress={() => setFilter(opt.key)}
              style={[styles.filterChip, filter === opt.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filter === opt.key && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => employee && fetchTodayCalls(employee.id)}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="phone-disabled" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {search ? 'No results found' : 'No calls scheduled'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Try a different search term' : 'Your schedule is clear for today'}
            </Text>
          </View>
        }
      />

      {/* Lead Info Sheet */}
      <LeadInfoSheet
        visible={infoVisible}
        client={infoClient}
        onClose={() => setInfoVisible(false)}
      />

      {/* Update Sheet */}
      <UpdateStatusSheet
        visible={sheetVisible}
        client={selectedClient}
        isUpdating={isUpdating}
        callDuration={trackedDuration}
        onClose={() => {
          setSheetVisible(false);
          setTrackedDuration(undefined);
        }}
        onUpdate={handleUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  greeting: { ...Typography.h3, color: Colors.textPrimary },
  date: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  idBadge: {
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  idText: { ...Typography.label, color: Colors.primary },
  searchRow: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  filterScroll: {
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyTitle: { ...Typography.h4, color: Colors.textSecondary },
  emptySubtitle: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
});
