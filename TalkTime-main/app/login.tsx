import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';

export default function LoginScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [idFocused, setIdFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const { login, isLoading } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const passRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!employeeId.trim() || !password.trim()) {
      showAlert('Missing Fields', 'Please enter your Employee ID and password.');
      return;
    }
    const result = await login(employeeId.trim(), password);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      showAlert('Login Failed', result.error || 'Invalid credentials.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.brandRow}>
            <View style={styles.logoMark}>
              <MaterialIcons name="phone-in-talk" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.brandName}>TalkTime</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in with your Employee ID</Text>

            {/* Employee ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMPLOYEE ID</Text>
              <View style={[styles.inputWrap, idFocused && styles.inputWrapFocused]}>
                <MaterialIcons name="badge" size={18} color={idFocused ? Colors.primary : Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. VIB_001"
                  placeholderTextColor={Colors.textMuted}
                  value={employeeId}
                  onChangeText={setEmployeeId}
                  autoCapitalize="characters"
                  returnKeyType="next"
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                  onSubmitEditing={() => passRef.current?.focus()}
                  accessibilityLabel="Employee ID"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={[styles.inputWrap, passFocused && styles.inputWrapFocused]}>
                <MaterialIcons name="lock" size={18} color={passFocused ? Colors.primary : Colors.textMuted} />
                <TextInput
                  ref={passRef}
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  onSubmitEditing={handleLogin}
                  accessibilityLabel="Password"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <PressableScale
              onPress={handleLogin}
              disabled={isLoading}
              style={[styles.loginBtn, isLoading && styles.loginBtnLoading]}
            >
              {isLoading ? (
                <Text style={styles.loginBtnText}>Signing in...</Text>
              ) : (
                <>
                  <MaterialIcons name="login" size={18} color="#fff" />
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </>
              )}
            </PressableScale>


          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(350).duration(500)} style={styles.footer}>
            TalkTime · Sales Call Manager · v1.0
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.md,
  },
  cardTitle: { ...Typography.h2, color: Colors.textPrimary },
  cardSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: -Spacing.sm },
  fieldGroup: { gap: Spacing.xs },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  inputWrapFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    ...Shadows.glow,
  },
  loginBtnLoading: { opacity: 0.7 },
  loginBtnText: { ...Typography.button, color: '#fff', fontSize: 16 },
  footer: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
});
