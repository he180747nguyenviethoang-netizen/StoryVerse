import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../features/settings/hooks';
import { authApi } from '../../features/auth/api';

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 22,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      flex: 1,
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 18,
    },
    hintText: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 12,
    },
    input: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      color: colors.text,
      fontSize: 18,
      letterSpacing: 8,
      marginBottom: 18,
    },
    submitBtn: {
      height: 50,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    submitText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}

export default function VerifyOtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const email = route.params?.email ?? '';
  const purpose = route.params?.purpose ?? 'register';

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const normalizedCode = code.trim();
    if (normalizedCode.length < 4) {
      Alert.alert(t('common.error'), t('auth.verifyOtp.codeInvalid'));
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authApi.verifyOtp({
        email,
        code: normalizedCode,
        purpose,
      });

      if (purpose === 'register') {
        Alert.alert(t('auth.verifyOtp.successTitle'), t('auth.verifyOtp.registerSuccessMessage'));
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Profile' } }],
        });
        return;
      }

      navigation.navigate('ResetPassword', {
        email,
        token: res?.token,
        code: normalizedCode,
      });
    } catch (error) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message;

      if (status === 400) {
        Alert.alert(t('common.error'), apiMessage || t('auth.errors.invalidOrExpiredCode'));
        return;
      }

      if (status === 404) {
        Alert.alert(t('common.error'), apiMessage || t('auth.errors.userNotFound'));
        return;
      }

      if (status === 401) {
        Alert.alert(t('common.error'), apiMessage || t('auth.errors.invalidToken'));
        return;
      }

      Alert.alert(t('common.error'), apiMessage || t('auth.errors.default'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('auth.verifyOtp.title')}</Text>
        </View>

        <Text style={styles.subtitle}>{t('auth.verifyOtp.subtitle')}</Text>
        <Text style={styles.hintText}>{t('auth.verifyOtp.emailHint', { email })}</Text>

        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9a-zA-Z]/g, ''))}
          placeholder={t('auth.verifyOtp.codePlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isSubmitting}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>{t('auth.verifyOtp.submitButton')}</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}
