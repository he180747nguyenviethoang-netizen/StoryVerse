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
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/hooks';
import { authApi } from '../../features/auth/api';
import { useSettings } from '../../features/settings/hooks';
import { SvgXml } from 'react-native-svg';

const GOOGLE_ICON_XML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>`;

const GoogleIcon = ({ width = 24, height = 24, style }) => (
  <View style={style}>
    <SvgXml xml={GOOGLE_ICON_XML} width={width} height={height} />
  </View>
);

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 40,
      marginVertical: -10,
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
      paddingTop: 32,
      paddingBottom: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 28,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
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
    forgotContainer: {
      alignSelf: 'flex-end',
      marginTop: -4,
      marginBottom: 24,
    },
    forgotText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
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
      marginVertical: 22,
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
      marginTop: 28,
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

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onSwitchMode }) {
  const { login } = useAuth();
  const navigation = useNavigation();
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  const busy = isLoading || isGoogleLoading;

  function validate() {
    const next = {};
    if (!email.trim()) next.email = t('auth.login.emailEmpty');
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = t('auth.login.emailInvalid');
    if (!password) next.password = t('auth.login.passwordEmpty');
    else if (password.length < 6) next.password = t('auth.login.passwordShort');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    try {
      setIsLoading(true);
      const res = await authApi.login({ email, password });
      await login(res.user, res.token);

      if (!onSwitchMode) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message;

      if (status === 403) {
        Alert.alert(t('common.error'), apiMessage || t('auth.errors.emailNotVerified'));
        navigation.navigate('VerifyOtp', {
          email: email.trim(),
          purpose: 'register',
        });
        return;
      }

      if (status === 401) {
        Alert.alert(t('common.error'), apiMessage || t('auth.errors.invalidCredentials'));
        return;
      }

      Alert.alert(t('common.error'), apiMessage || t('auth.errors.default'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setIsGoogleLoading(true);
      const result = await promptAsync();

      if (result?.type === 'success') {
        const { id_token } = result.params;
        const res = await authApi.loginWithGoogle(id_token);
        await login(res.user, res.token);

        if (!onSwitchMode) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
      } else if (result?.type === 'cancel') {
        // User canceled, do nothing or show a subtle toast
      } else {
        Alert.alert(t('common.error'), t('auth.errors.googleFailed'));
      }
    } catch (error) {
      console.error('Google Login Error:', error);
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
            <Text style={styles.title}>{t('auth.login.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.login.emailLabel')}</Text>
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
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.login.passwordLabel')}</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : undefined]}>
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
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setErrors((e) => ({ ...e, password: undefined }));
                  }}
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
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotContainer}
              disabled={busy}
              onPress={() => {
                console.log('Navigate to Forgot Password');
                navigation.navigate('ForgotPassword')}}
            >
              <Text style={styles.forgotText}>{t('auth.login.forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={busy}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('auth.login.loginButton')}</Text>
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
                  <GoogleIcon width={24} height={24} style={{ marginRight: 12 }} />
                  <Text style={styles.googleButtonText}>{t('auth.login.googleButton')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.login.noAccount')} </Text>
              <TouchableOpacity
                onPress={() => {
                  if (onSwitchMode) {
                    onSwitchMode('register');
                  } else {
                    navigation.navigate('Register');
                  }
                }}
                disabled={busy}
              >
                <Text style={styles.footerLink}>{t('auth.login.registerLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
