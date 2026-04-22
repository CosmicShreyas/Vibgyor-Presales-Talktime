import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Client } from '@/types';
import { CALL_STATUSES } from '@/services/mockData';
import { PhoneService } from '@/services/phoneService';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';

interface UpdateStatusSheetProps {
  visible: boolean;
  client: Client | null;
  isUpdating: boolean;
  callDuration?: number; // seconds tracked from call
  onClose: () => void;
  onUpdate: (status: string, notes: string, callbackDate?: string, callDuration?: number) => void;
}

export function UpdateStatusSheet({ visible, client, isUpdating, callDuration, onClose, onUpdate }: UpdateStatusSheetProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const translateY = useSharedValue(600);
  const opacity = useSharedValue(0);

  const show = useCallback(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 250 });
  }, []);

  const hide = useCallback((cb?: () => void) => {
    opacity.value = withTiming(0, { duration: 150 });
    translateY.value = withSpring(600, { damping: 20, stiffness: 250 }, () => {
      if (cb) runOnJS(cb)();
    });
  }, []);

  useEffect(() => {
    if (visible) {
      // Pre-select current status
      setSelectedStatus(client?.status || '');
      setNotes(client?.notes || '');
      setCallbackDate('');
      // Set current date and time
      const now = new Date();
      setSelectedDate(now);
      setSelectedTime(now);
      show();
    }
  }, [visible, client]);

  const handleClose = () => {
    hide(onClose);
  };

  const handleUpdate = () => {
    if (!selectedStatus) return;
    onUpdate(selectedStatus, notes, callbackDate || undefined, callDuration);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedTime(date);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!client) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <Animated.View style={[styles.sheet, sheetStyle]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Client Header */}
            <View style={styles.clientHeader}>
              <View style={styles.clientInfo}>
                <Text style={styles.sheetTitle}>Update Call Status</Text>
                <Text style={styles.clientLabel}>{client.name} · {client.company}</Text>
              </View>
              <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

              {/* Date and Time Pickers */}
              <View style={styles.dateTimeSection}>
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeItem}>
                    <Text style={styles.sectionLabel}>DATE</Text>
                    <Pressable 
                      onPress={() => setShowDatePicker(true)}
                      style={styles.dateTimeInputWrap}
                    >
                      <MaterialIcons name="calendar-today" size={16} color={Colors.textSecondary} />
                      <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Text style={styles.sectionLabel}>TIME</Text>
                    <Pressable 
                      onPress={() => setShowTimePicker(true)}
                      style={styles.dateTimeInputWrap}
                    >
                      <MaterialIcons name="access-time" size={16} color={Colors.textSecondary} />
                      <Text style={styles.dateTimeText}>{formatTime(selectedTime)}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Date Picker Modal */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  textColor={Colors.textPrimary}
                />
              )}

              {/* Time Picker Modal */}
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  textColor={Colors.textPrimary}
                />
              )}

              {/* Call Duration Banner */}
              {callDuration ? (
                <View style={styles.durationBanner}>
                  <View style={styles.durationIconWrap}>
                    <MaterialIcons name="timer" size={18} color={Colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.durationLabel}>Call Duration Recorded</Text>
                    <Text style={styles.durationValue}>{PhoneService.formatDuration(callDuration)}</Text>
                  </View>
                </View>
              ) : null}

              {/* Status Grid */}
              <Text style={styles.sectionLabel}>CALL OUTCOME</Text>
              <View style={styles.statusGrid}>
                {CALL_STATUSES.map(status => {
                  const isSelected = selectedStatus === status.key;
                  return (
                    <PressableScale
                      key={status.key}
                      onPress={() => setSelectedStatus(status.key)}
                      style={[
                        styles.statusOption,
                        { borderColor: isSelected ? status.color : Colors.border },
                        isSelected && { backgroundColor: status.color + '18' },
                      ]}
                    >
                      <MaterialIcons
                        name={status.icon as any}
                        size={22}
                        color={isSelected ? status.color : Colors.textSecondary}
                      />
                      <Text style={[styles.statusLabel, isSelected && { color: status.color }]}>
                        {status.label}
                      </Text>
                      <Text style={styles.statusDesc}>{status.description}</Text>
                    </PressableScale>
                  );
                })}
              </View>

              {/* Callback Date */}
              {selectedStatus === 'callback' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.sectionLabel}>CALLBACK DATE & TIME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. April 12, 2026 at 3:00 PM"
                    placeholderTextColor={Colors.textMuted}
                    value={callbackDate}
                    onChangeText={setCallbackDate}
                  />
                </View>
              )}

              {/* Remarks */}
              <View style={styles.inputGroup}>
                <Text style={styles.sectionLabel}>REMARKS</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Add call remarks, follow-up details..."
                  placeholderTextColor={Colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit */}
              <PressableScale
                onPress={handleUpdate}
                disabled={!selectedStatus || isUpdating}
                style={[
                  styles.submitBtn,
                  (!selectedStatus || isUpdating) && styles.submitDisabled,
                ]}
              >
                {isUpdating ? (
                  <Text style={styles.submitText}>Updating...</Text>
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={18} color="#fff" />
                    <Text style={styles.submitText}>Save & Sync</Text>
                  </>
                )}
              </PressableScale>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 32,
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
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clientInfo: { flex: 1 },
  sheetTitle: { ...Typography.h3, color: Colors.textPrimary },
  clientLabel: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  dateTimeSection: {
    gap: Spacing.xs,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateTimeItem: {
    flex: 1,
    gap: Spacing.xs,
  },
  dateTimeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  dateTimeText: {
    flex: 1,
    color: Colors.textPrimary,
    ...Typography.body,
    fontSize: 14,
  },
  durationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.25)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  durationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6,182,212,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  durationValue: {
    ...Typography.h4,
    color: Colors.accent,
    marginTop: 1,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusOption: {
    width: '47%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.sm + 2,
    gap: 4,
  },
  statusLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    color: Colors.textPrimary,
    ...Typography.body,
  },
  inputMulti: {
    minHeight: 90,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    ...Typography.button,
    color: '#fff',
  },
});
