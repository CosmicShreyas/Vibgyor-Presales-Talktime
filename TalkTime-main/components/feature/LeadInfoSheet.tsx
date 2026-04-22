import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { Client } from '@/types';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityTag } from '@/components/ui/PriorityTag';

interface LeadInfoSheetProps {
  visible: boolean;
  client: Client | null;
  onClose: () => void;
}

function InfoRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  tappable,
  onTap,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  tappable?: boolean;
  onTap?: () => void;
}) {
  return (
    <Pressable
      onPress={tappable ? onTap : undefined}
      style={({ pressed }) => [styles.infoRow, tappable && pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.infoIcon, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, tappable && { color: Colors.primary }]}>{value}</Text>
      </View>
      {tappable ? (
        <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

export function LeadInfoSheet({ visible, client, onClose }: LeadInfoSheetProps) {
  const translateY = useSharedValue(700);
  const opacity = useSharedValue(0);

  const show = useCallback(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 22, stiffness: 260 });
  }, []);

  const hide = useCallback((cb?: () => void) => {
    opacity.value = withTiming(0, { duration: 150 });
    translateY.value = withSpring(700, { damping: 22, stiffness: 260 }, () => {
      if (cb) runOnJS(cb)();
    });
  }, []);

  useEffect(() => {
    if (visible) show();
  }, [visible]);

  const handleClose = () => hide(onClose);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!client) return null;

  const priorityLabel = client.priority === 'high' ? 'HIGH' : client.priority === 'medium' ? 'MED' : 'LOW';

  return (
    <Modal transparent visible={visible} onRequestClose={handleClose} statusBarTranslucent>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>Lead Information</Text>
              <Text style={styles.headerName}>{client.name}</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
              <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Status + Priority badges */}
          <View style={styles.badgeRow}>
            <StatusBadge status={client.status} size="sm" />
            <View style={styles.priorityBadge}>
              <Text style={[styles.priorityText, { color: client.priority === 'high' ? '#F59E0B' : client.priority === 'medium' ? Colors.primary : Colors.textSecondary }]}>
                {priorityLabel}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {/* Basic Information */}
            <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>
            <View style={styles.section}>
              <InfoRow
                icon="person"
                iconBg="rgba(139, 92, 246, 0.18)"
                iconColor="#8B5CF6"
                label="Name"
                value={client.name}
              />
              <View style={styles.divider} />
              <InfoRow
                icon="business"
                iconBg="rgba(245, 158, 11, 0.18)"
                iconColor="#F59E0B"
                label="Company"
                value={client.company}
              />
            </View>

            {/* Contact Information */}
            <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
            <View style={styles.section}>
              <InfoRow
                icon="phone"
                iconBg="rgba(16, 185, 129, 0.18)"
                iconColor="#10B981"
                label="Phone Number"
                value={client.phone}
                tappable
                onTap={() => Linking.openURL(`tel:${client.phone}`)}
              />
              <View style={styles.divider} />
              <InfoRow
                icon="email"
                iconBg="rgba(239, 68, 68, 0.18)"
                iconColor="#EF4444"
                label="Email"
                value={client.email}
                tappable
                onTap={() => Linking.openURL(`mailto:${client.email}`)}
              />
            </View>

            {/* Location */}
            <Text style={styles.sectionTitle}>LOCATION</Text>
            <View style={styles.section}>
              <InfoRow
                icon="location-on"
                iconBg="rgba(239, 68, 68, 0.18)"
                iconColor="#EF4444"
                label="Address"
                value={client.location}
              />
            </View>

            {/* Project Details */}
            <Text style={styles.sectionTitle}>PROJECT DETAILS</Text>
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: 'rgba(59, 130, 246, 0.18)' }]}>
                  <MaterialIcons name="description" size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Description</Text>
                  <Text style={styles.infoValueMulti}>{client.notes || 'No notes added.'}</Text>
                </View>
              </View>
            </View>

            {/* Deal Value */}
            <Text style={styles.sectionTitle}>DEAL VALUE</Text>
            <View style={styles.section}>
              <InfoRow
                icon="currency-rupee"
                iconBg="rgba(16, 185, 129, 0.18)"
                iconColor="#10B981"
                label="Estimated Value"
                value={client.value}
              />
              <View style={styles.divider} />
              <InfoRow
                icon="category"
                iconBg="rgba(6, 182, 212, 0.18)"
                iconColor={Colors.accent}
                label="Industry"
                value={client.industry}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#161B22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  headerName: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  body: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  section: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  infoValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoValueMulti: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 70,
  },
});
