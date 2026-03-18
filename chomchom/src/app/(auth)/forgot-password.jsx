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
import { useNavigation } from '@react-navigation/native';
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
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 14,
      height: 52,
      marginBottom: 18,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 0,
      marginLeft: 8,
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

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      Alert.alert(t('common.error'), t('auth.login.emailInvalid'));
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.forgotPassword({ email: normalizedEmail });
      Alert.alert(t('auth.forgotPassword.successTitle'), t('auth.forgotPassword.successMessage'));
      navigation.navigate('VerifyOtp', {
        email: normalizedEmail,
        purpose: 'forgot-password',
      });
    } catch (error) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message;
      if (status === 404) {
        Alert.alert(t('common.error'), apiMessage || t('auth.errors.userNotFound'));
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
          <Text style={styles.title}>{t('auth.forgotPassword.title')}</Text>
        </View>

        <Text style={styles.subtitle}>{t('auth.forgotPassword.subtitle')}</Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>{t('auth.forgotPassword.submitButton')}</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}
