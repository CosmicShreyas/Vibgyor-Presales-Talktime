import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Radius } from '@/constants/theme';

const PRIORITY_MAP = {
  high: { label: 'HIGH', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  medium: { label: 'MED', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  low: { label: 'LOW', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export function PriorityTag({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const cfg = PRIORITY_MAP[priority];
  return (
    <View style={[styles.tag, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
