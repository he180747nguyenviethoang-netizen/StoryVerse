import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/hooks';
import { authApi } from '../../features/auth/api';
import { useSettings } from '../../features/settings/hooks';

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 40,
      marginVertical: -10,
      marginBottom: 80,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    card: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 28,
      paddingTop: 28,
      paddingBottom: 40,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 14,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 7,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 14,
      height: 52,
    },
    inputError: {
      borderColor: colors.error,
      backgroundColor: colors.errorLight,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 0,
    },
    eyeButton: {
      padding: 4,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 5,
      marginLeft: 2,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonDisabled: {
      opacity: 0.65,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 13,
      color: colors.textMuted,
      marginHorizontal: 14,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      height: 52,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    googleBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.google,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    googleLetter: {
      color: colors.white,
      fontWeight: '900',
      fontSize: 14,
    },
    googleButtonText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '700',
    },
  });
}

export default function RegisterScreen({ onSwitchMode }) {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Schema inside component so validation messages update with language changes
  const schema = useMemo(
    () =>
      yup.object({
        username: yup
          .string()
          .trim()
          .required(t('auth.register.usernameEmpty'))
          .min(3, t('auth.register.usernameShort')),
        email: yup
          .string()
          .trim()
          .required(t('auth.register.emailEmpty'))
          .email(t('auth.register.emailInvalid')),
        password: yup
          .string()
          .required(t('auth.register.passwordEmpty'))
          .min(6, t('auth.register.passwordShort')),
        confirmPassword: yup
          .string()
          .required(t('auth.register.confirmRequired'))
          .oneOf([yup.ref('password')], t('auth.register.passwordMismatch')),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  const busy = isSubmitting || isGoogleLoading;

  async function onSubmit(values) {
    try {
      await authApi.register({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      Alert.alert(t('auth.register.verifyTitle'), t('auth.register.verifyMessage'));
      navigation.navigate('VerifyOtp', {
        email: values.email.trim(),
        purpose: 'register',
      });
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ??
        (status === 400 ? t('auth.errors.registerInvalid') : t('auth.errors.default'));
      Alert.alert(t('common.error'), message);
    }
  }

  async function handleGoogleLogin() {
    try {
      setIsGoogleLoading(true);
      const res = await authApi.loginWithGoogle();
      login(res.user, res.token);
    } catch {
      Alert.alert(t('common.error'), t('auth.errors.googleFailed'));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{t('auth.register.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.register.usernameLabel')}</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
                  <View
                    style={[styles.inputWrapper, errors.username ? styles.inputError : undefined]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={errors.username ? colors.error : colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="nguyenvana"
                      placeholderTextColor={colors.textMuted}
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                    />
                  </View>
                )}
              />
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username.message}</Text>
              ) : null}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.register.emailLabel')}</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.inputWrapper, errors.email ? styles.inputError : undefined]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={errors.email ? colors.error : colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="example@email.com"
                      placeholderTextColor={colors.textMuted}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                    />
                  </View>
                )}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.register.passwordLabel')}</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View
                    style={[styles.inputWrapper, errors.password ? styles.inputError : undefined]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={errors.password ? colors.error : colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!showPassword}
                      editable={!busy}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      style={styles.eyeButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              ) : null}
            </View>

            {/* Confirm password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.register.confirmPasswordLabel')}</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.confirmPassword ? styles.inputError : undefined,
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color={errors.confirmPassword ? colors.error : colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!showConfirm}
                      editable={!busy}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm((v) => !v)}
                      style={styles.eyeButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              ) : null}
            </View>

            {/* Register button */}
            <TouchableOpacity
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={busy}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('auth.register.createButton')}</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              style={[styles.googleButton, busy && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={busy}
              activeOpacity={0.85}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={colors.google} />
              ) : (
                <>
                  <View style={styles.googleBadge}>
                    <Text style={styles.googleLetter}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>{t('auth.login.googleButton')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.register.hasAccount')} </Text>
              <TouchableOpacity
                onPress={() => {
                  if (onSwitchMode) {
                    onSwitchMode('login');
                  } else {
                    navigation.navigate('Login');
                  }
                }}
                disabled={busy}
              >
                <Text style={styles.footerLink}>{t('auth.register.loginLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
