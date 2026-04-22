import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useCalls } from '@/hooks/useCalls';
import { useConnection } from '@/contexts/ConnectionContext';
import { callsService } from '@/services/callsService';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';
import { useAlert } from '@/template';

export default function ProfileScreen() {
  const { employee, logout } = useAuth();
  const { clients, callHistory } = useCalls();
  const { status, retryCount, maxRetries } = useConnection();
  const [stats, setStats] = useState({ totalCalls: 0, thisMonth: 0, successRate: 0 });
  const [mappingStats, setMappingStats] = useState({ totalSubmissions: 0, thisMonth: 0, avgMonthly: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const isMappingUser = employee?.role === 'mapping';

  useEffect(() => {
    if (isMappingUser) {
      fetchMappingStats();
    } else {
      fetchStats();
    }
  }, [isMappingUser]);

  const fetchStats = async () => {
    try {
      const data = await callsService.getCallStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchMappingStats = async () => {
    try {
      // TODO: Replace with actual API call when mapping stats endpoint is available
      // For now, using placeholder data
      // const data = await mappingService.getMappingStats();
      
      // Placeholder calculation - replace with actual API data
      const totalSubmissions = 0; // Get from API
      const thisMonth = 0; // Get from API
      
      // Calculate average monthly submissions
      // Assuming we have data from account creation date
      const accountCreatedDate = new Date(employee?.createdAt || Date.now());
      const monthsSinceCreation = Math.max(1, 
        (new Date().getFullYear() - accountCreatedDate.getFullYear()) * 12 +
        (new Date().getMonth() - accountCreatedDate.getMonth()) + 1
      );
      
      const avgMonthly = totalSubmissions > 0 
        ? Math.round(totalSubmissions / monthsSinceCreation) 
        : 0;
      
      setMappingStats({
        totalSubmissions,
        thisMonth,
        avgMonthly,
      });
    } catch (error) {
      console.error('Error fetching mapping stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return `Reconnecting (${retryCount}/${maxRetries})`;
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return Colors.success;
      case 'reconnecting':
        return Colors.warning;
      case 'disconnected':
        return Colors.error;
      default:
        return Colors.textMuted;
    }
  };

  if (!employee) return null;

  const todayDone = clients.filter(c => c.status !== 'pending').length;
  const todayQualified = clients.filter(c => c.status === 'qualified').length;
  const todayPending = clients.filter(c => c.status === 'pending').length;

  // Extract initials from name for avatar
  const avatar = employee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{avatar}</Text>
          </View>
          <Text style={styles.name}>{employee.name}</Text>
          <Text style={styles.role}>{employee.role === 'mapping' ? 'Mapping Partner' : 'Sales Team'}</Text>
          <View style={styles.idPill}>
            <MaterialIcons name="badge" size={14} color={Colors.primary} />
            <Text style={styles.idText}>{employee.employeeId || employee.mappingId || employee.id}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="email" size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>{employee.email}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="verified" size={14} color={Colors.success} />
              <Text style={styles.metaText}>Active</Text>
            </View>
          </View>
        </View>

        {/* Conditional Content Based on Role */}
        {isMappingUser ? (
          // MAPPING USER PROFILE
          <>
            {/* Mapping Stats */}
            <Text style={styles.sectionTitle}>MAPPING ACTIVITY</Text>
            <View style={styles.careerCard}>
              {loadingStats ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading stats...</Text>
                </View>
              ) : (
                <>
                  <CareerStat label="Total Submissions" value={mappingStats.totalSubmissions.toString()} icon="map" />
                  <View style={styles.cardDivider} />
                  <CareerStat label="This Month" value={mappingStats.thisMonth.toString()} icon="date-range" />
                  <View style={styles.cardDivider} />
                  <CareerStat label="Avg Monthly Submissions" value={mappingStats.avgMonthly.toString()} icon="trending-up" />
                </>
              )}
            </View>
          </>
        ) : (
          // SALES USER PROFILE
          <>
            {/* Today's Stats */}
            <Text style={styles.sectionTitle}>TODAY</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Called" value={todayDone} icon="phone" color={Colors.primary} />
              <StatCard label="Qualified" value={todayQualified} icon="check-circle" color={Colors.statusConnected} />
              <StatCard label="Pending" value={todayPending} icon="schedule" color={Colors.statusNoAnswer} />
              <StatCard label="History" value={callHistory.length} icon="history" color={Colors.accent} />
            </View>

            {/* Career Stats */}
            <Text style={styles.sectionTitle}>CAREER STATS</Text>
            <View style={styles.careerCard}>
              {loadingStats ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading stats...</Text>
                </View>
              ) : (
                <>
                  <CareerStat label="Total Calls Made" value={stats.totalCalls.toLocaleString()} icon="call" />
                  <View style={styles.cardDivider} />
                  <CareerStat label="Success Rate" value={`${stats.successRate}%`} icon="trending-up" />
                  <View style={styles.cardDivider} />
                  <CareerStat label="This Month" value={stats.thisMonth.toString()} icon="date-range" />
                </>
              )}
            </View>
          </>
        )}

        {/* Actions */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.actionsCard}>
          <ActionRow icon="info-outline" label="App Version" value="v1.0.0" />
          <View style={styles.cardDivider} />
          <ActionRow icon="api" label="Status" value={getStatusText()} valueColor={getStatusColor()} />
        </View>

        <PressableScale onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '33' }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CareerStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.careerRow}>
      <View style={styles.careerLeft}>
        <MaterialIcons name={icon as any} size={16} color={Colors.primary} />
        <Text style={styles.careerLabel}>{label}</Text>
      </View>
      <Text style={styles.careerValue}>{value}</Text>
    </View>
  );
}

function ActionRow({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionLeft}>
        <MaterialIcons name={icon as any} size={16} color={Colors.textSecondary} />
        <Text style={styles.actionLabel}>{label}</Text>
      </View>
      <Text style={[styles.actionValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 2,
    borderColor: Colors.primary + '44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  name: { ...Typography.h2, color: Colors.textPrimary },
  role: { ...Typography.bodySmall, color: Colors.textSecondary },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  idText: { ...Typography.label, color: Colors.primary },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  careerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  careerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  careerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  careerLabel: { ...Typography.body, color: Colors.textSecondary },
  careerValue: { ...Typography.h4, color: Colors.textPrimary },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  actionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionLabel: { ...Typography.body, color: Colors.textSecondary },
  actionValue: { ...Typography.bodySmall, color: Colors.textMuted },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  logoutText: {
    ...Typography.button,
    color: Colors.error,
  },
});
