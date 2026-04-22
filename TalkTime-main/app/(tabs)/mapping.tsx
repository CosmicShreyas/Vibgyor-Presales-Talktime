import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useAlert } from '@/template';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';

interface MappingFormData {
  clientName: string;
  clientPhone: string;
  builderName: string;
  builderPhone: string;
  photos: string[];
  location: string;
  locationCoords: { lat: number; lng: number } | null;
  budget: string;
  address: string;
  typeOfDwelling: string;
  completionStatus: string;
  description: string;
}

const INITIAL_FORM: MappingFormData = {
  clientName: '',
  clientPhone: '',
  builderName: '',
  builderPhone: '',
  photos: [],
  location: '',
  locationCoords: null,
  budget: '',
  address: '',
  typeOfDwelling: '',
  completionStatus: '',
  description: '',
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  rightElement,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  rightElement?: React.ReactNode;
  editable?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.group}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[
        fieldStyles.inputWrap,
        multiline && fieldStyles.multilineWrap,
        focused && fieldStyles.focused,
        !editable && fieldStyles.disabled,
      ]}>
        <TextInput
          style={[fieldStyles.input, multiline && fieldStyles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          accessibilityLabel={label}
        />
        {rightElement}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { gap: 6 },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  multilineWrap: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    minHeight: 110,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  disabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  multilineInput: {
    lineHeight: 22,
    paddingTop: 4,
  },
});

export default function MappingScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [form, setForm] = useState<MappingFormData>(INITIAL_FORM);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((key: keyof MappingFormData) => (val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Denied', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map(a => a.uri);
      setForm(prev => ({ ...prev, photos: [...prev.photos, ...uris].slice(0, 6) }));
    }
  };

  const handleRemovePhoto = (uri: string) => {
    setForm(prev => ({ ...prev, photos: prev.photos.filter(p => p !== uri) }));
  };

  const handleFetchLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Location access is required to fetch coordinates.');
        setFetchingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = reverseGeo[0];
      const locationStr = [place?.street, place?.district, place?.city, place?.region]
        .filter(Boolean)
        .join(', ') || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setForm(prev => ({
        ...prev,
        location: locationStr,
        locationCoords: { lat: latitude, lng: longitude },
      }));
    } catch {
      setForm(prev => ({ ...prev, location: 'Unable to fetch location' }));
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleViewLocation = () => {
    if (!form.locationCoords) {
      showAlert('No Location', 'Fetch your location first.');
      return;
    }
    const { lat, lng } = form.locationCoords;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    if (url) {
      const { Linking } = require('react-native');
      Linking.openURL(url);
    }
  };

  const handleSubmit = async () => {
    if (!form.clientName.trim()) {
      showAlert('Required Field', 'Please enter the Client Name.');
      return;
    }
    if (!form.clientPhone.trim()) {
      showAlert('Required Field', 'Please enter the Client Phone.');
      return;
    }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));

    console.log('[TalkTime Mapping] Submit Payload →', {
      endpoint: '/api/mapping/submit',
      ...form,
      timestamp: new Date().toISOString(),
    });

    setIsSubmitting(false);
    setForm(INITIAL_FORM);
    showAlert('Submitted', 'Mapping data has been saved successfully.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mappings Form</Text>
            <Text style={styles.subtitle}>Fill in the site details below</Text>
          </View>
          <View style={styles.iconWrap}>
            <MaterialIcons name="map" size={22} color={Colors.primary} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.section}>
            <Text style={styles.sectionLabel}>CLIENT DETAILS</Text>
            <View style={styles.card}>
              <FormField
                label="Client Name"
                value={form.clientName}
                onChangeText={updateField('clientName')}
                placeholder="Enter client name"
              />
              <View style={styles.divider} />
              <FormField
                label="Client Phone"
                value={form.clientPhone}
                onChangeText={updateField('clientPhone')}
                placeholder="+91 XXXXX XXXXX"
                keyboardType="phone-pad"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.section}>
            <Text style={styles.sectionLabel}>BUILDER / ENGINEER</Text>
            <View style={styles.card}>
              <FormField
                label="Builder / Engineer Name"
                value={form.builderName}
                onChangeText={updateField('builderName')}
                placeholder="Enter name"
              />
              <View style={styles.divider} />
              <FormField
                label="Builder / Engineer Phone"
                value={form.builderPhone}
                onChangeText={updateField('builderPhone')}
                placeholder="+91 XXXXX XXXXX"
                keyboardType="phone-pad"
              />
            </View>
          </Animated.View>

          {/* Upload Photo */}
          <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.section}>
            <Text style={styles.sectionLabel}>UPLOAD PHOTO</Text>
            <View style={styles.card}>
              <Pressable
                onPress={handlePickPhoto}
                style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.75 }]}
              >
                <MaterialIcons name="add-photo-alternate" size={20} color={Colors.primary} />
                <Text style={styles.uploadText}>Choose Photos</Text>
                <Text style={styles.uploadCount}>
                  {form.photos.length > 0 ? `${form.photos.length} selected` : 'No file chosen'}
                </Text>
              </Pressable>
              {form.photos.length > 0 ? (
                <View style={styles.photoGrid}>
                  {form.photos.map((uri, i) => (
                    <View key={i} style={styles.photoThumb}>
                      <Image source={{ uri }} style={styles.photoImg} contentFit="cover" />
                      <Pressable
                        onPress={() => handleRemovePhoto(uri)}
                        style={styles.removePhoto}
                        hitSlop={6}
                      >
                        <MaterialIcons name="close" size={12} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* Location */}
          <Animated.View entering={FadeInDown.delay(220).duration(350)} style={styles.section}>
            <Text style={styles.sectionLabel}>LOCATION</Text>
            <View style={styles.card}>
              <View style={fieldStyles.group}>
                <Text style={fieldStyles.label}>Location</Text>
                <View style={[fieldStyles.inputWrap, { gap: Spacing.sm }]}>
                  <TextInput
                    style={[fieldStyles.input]}
                    value={form.location}
                    onChangeText={updateField('location')}
                    placeholder="Tap fetch to get location"
                    placeholderTextColor={Colors.textMuted}
                    editable={false}
                  />
                  <Pressable
                    onPress={handleFetchLocation}
                    style={({ pressed }) => [styles.fetchBtn, pressed && { opacity: 0.75 }]}
                    disabled={fetchingLocation}
                  >
                    {fetchingLocation ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <MaterialIcons name="my-location" size={14} color="#fff" />
                    )}
                    <Text style={styles.fetchBtnText}>{fetchingLocation ? '...' : 'Fetch'}</Text>
                  </Pressable>
                  {form.locationCoords ? (
                    <Pressable
                      onPress={handleViewLocation}
                      style={({ pressed }) => [styles.viewBtn, pressed && { opacity: 0.75 }]}
                    >
                      <MaterialIcons name="map" size={14} color={Colors.primary} />
                      <Text style={styles.viewBtnText}>View</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Property Details */}
          <Animated.View entering={FadeInDown.delay(260).duration(350)} style={styles.section}>
            <Text style={styles.sectionLabel}>PROPERTY DETAILS</Text>
            <View style={styles.card}>
              <FormField
                label="Budget"
                value={form.budget}
                onChangeText={updateField('budget')}
                placeholder="e.g. ₹25,00,000"
                keyboardType="default"
              />
              <View style={styles.divider} />
              <FormField
                label="Address"
                value={form.address}
                onChangeText={updateField('address')}
                placeholder="Full property address"
              />
              <View style={styles.divider} />
              <FormField
                label="Type of Dwelling"
                value={form.typeOfDwelling}
                onChangeText={updateField('typeOfDwelling')}
                placeholder="e.g. Apartment, Villa, Plot"
              />
              <View style={styles.divider} />
              <FormField
                label="Completion Status"
                value={form.completionStatus}
                onChangeText={updateField('completionStatus')}
                placeholder="e.g. Under Construction, Ready"
              />
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(300).duration(350)} style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <View style={styles.card}>
              <FormField
                label="Description"
                value={form.description}
                onChangeText={updateField('description')}
                placeholder="Additional notes or observations..."
                multiline
              />
            </View>
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.delay(340).duration(350)} style={styles.submitSection}>
            <PressableScale
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={20} color="#fff" />
                  <Text style={styles.submitText}>Submit</Text>
                </>
              )}
            </PressableScale>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.sm,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '44',
    borderStyle: 'dashed',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  uploadText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 14,
  },
  uploadCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 64,
    justifyContent: 'center',
  },
  fetchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  submitSection: {
    marginTop: Spacing.sm,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.glow,
  },
  submitText: {
    ...Typography.button,
    color: '#fff',
    fontSize: 16,
  },
});
