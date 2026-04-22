import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Client } from '@/types';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityTag } from '@/components/ui/PriorityTag';
import { PhoneService } from '@/services/phoneService';

interface ClientCardProps {
  client: Client;
  index: number;
  onPress: (client: Client) => void;
  onCallPress: (client: Client) => void;
  onInfoPress: (client: Client) => void;
}

export const ClientCard = memo(function ClientCard({ client, onPress, onCallPress, onInfoPress }: ClientCardProps) {
  const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#F97316'];
  const colorIdx = client.id.charCodeAt(client.id.length - 1) % avatarColors.length;
  const avatarColor = avatarColors[colorIdx];

  return (
    <PressableScale onPress={() => onPress(client)} style={styles.card}>
      <View style={[styles.leftAccent, { backgroundColor: avatarColor }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '44' }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.clientName} numberOfLines={1}>{client.name}</Text>
            <Text style={styles.company} numberOfLines={1}>{client.company}</Text>
          </View>
          <PriorityTag priority={client.priority} />
        </View>

        {/* Meta row — location + industry + value */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{client.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="business" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{client.industry}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="currency-rupee" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{client.value}</Text>
          </View>
        </View>

        {/* Duration chip */}
        {client.lastCallDuration ? (
          <View style={styles.durationChip}>
            <MaterialIcons name="timer" size={12} color={Colors.accent} />
            <Text style={styles.durationText}>
              Last call: {PhoneService.formatDuration(client.lastCallDuration)}
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footerRow}>
          <StatusBadge status={client.status} size="sm" />
          <View style={styles.actionBtns}>
            {/* Info button */}
            <Pressable
              onPress={() => onInfoPress(client)}
              style={styles.infoBtn}
              hitSlop={8}
            >
              <MaterialIcons name="info-outline" size={14} color={Colors.accent} />
            </Pressable>
            {/* Direct call button */}
            <Pressable
              onPress={() => onCallPress(client)}
              style={styles.dialBtn}
              hitSlop={8}
            >
              <MaterialIcons name="phone" size={14} color="#fff" />
              <Text style={styles.dialBtnText}>Call</Text>
            </Pressable>
            {/* Update status */}
            <Pressable
              onPress={() => onPress(client)}
              style={styles.editBtn}
              hitSlop={8}
            >
              <MaterialIcons name="edit" size={12} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftAccent: {
    width: 3,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nameBlock: {
    flex: 1,
  },
  clientName: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  company: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.25)',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dialBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
