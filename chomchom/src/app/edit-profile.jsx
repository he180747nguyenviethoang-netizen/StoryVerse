import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../features/auth/hooks';
import { useSettings } from '../features/settings/hooks';
import { authApi } from '../features/auth/api';

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 32,
      gap: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      gap: 12,
    },
    warningCard: {
      borderColor: colors.error,
      backgroundColor: colors.errorLight,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    warningTitle: {
      color: colors.error,
    },
    warningText: {
      color: colors.error,
      fontSize: 13,
      lineHeight: 18,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 6,
      fontWeight: '500',
    },
    input: {
      height: 46,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      color: colors.text,
      backgroundColor: colors.surface,
      fontSize: 14,
    },
    inputDisabled: {
      opacity: 0.7,
    },
    actionBtn: {
      marginTop: 6,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    actionBtnDanger: {
      backgroundColor: colors.error,
    },
    actionText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 14,
    },
  });
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateCurrentUser, logout } = useAuth();
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      if (!user?._id) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const userDetail = await authApi.getUserById(user._id);
        const resolvedUser = userDetail?.user || userDetail;
        if (!cancelled) {
          setUsername(resolvedUser?.username || user?.username || '');
          setEmail(resolvedUser?.email || user?.email || '');
        }
      } catch {
        if (!cancelled) {
          setUsername(user?.username || '');
          setEmail(user?.email || '');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSaveProfile = async () => {
    const nextUsername = username.trim();
    if (!nextUsername) {
      Alert.alert(t('profile.edit.alerts.notice'), t('profile.edit.alerts.usernameRequired'));
      return;
    }

    if (!user?._id) {
      Alert.alert(t('profile.edit.alerts.error'), t('profile.edit.alerts.userNotFound'));
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await authApi.updateProfile(user._id, {
        username: nextUsername,
        email,
      });

      const nextUser = {
        ...user,
        ...(updated?.user || updated),
        _id: (updated?.user || updated)?._id || user._id,
      };

      await updateCurrentUser(nextUser);
      Alert.alert(t('profile.edit.alerts.success'), t('profile.edit.alerts.profileUpdated'));
    } catch (error) {
      const message = error?.response?.data?.message || t('profile.edit.alerts.profileUpdateFailed');
      Alert.alert(t('profile.edit.alerts.error'), message);
    } finally {
      setSavingProfile(false);
    }
  };

    async function handleLogout() {
      Alert.alert(t('auth.logout.title'), t('auth.logout.confirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout.button'),
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await authApi.logout();
            } catch {
              // Server-side logout failed — still clear local credentials
            } finally {
              logout();
              setIsLoggingOut(false);
            }
          },
        },
      ]);
    }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('profile.edit.alerts.notice'), t('profile.edit.alerts.passwordInfoRequired'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('profile.edit.alerts.notice'), t('profile.edit.alerts.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('profile.edit.alerts.notice'), t('profile.edit.alerts.passwordConfirmMismatch'));
      return;
    }

    try {
      setSavingPassword(true);
      await authApi.changePassword(user._id, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(
        t('profile.edit.alerts.success'),
        t('profile.edit.alerts.passwordUpdated'),
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await authApi.logout();
              } catch {
                // server-side logout failed — local logout still runs
              }
              logout();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        (status === 404
          ? t('profile.edit.alerts.passwordEndpointNotSupported', {
              endpoint: '/api/users/:id/password',
            })
          : t('profile.edit.alerts.passwordUpdateFailed'));
      Alert.alert(t('profile.edit.alerts.error'), message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.edit.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('profile.edit.profileSectionTitle')}</Text>

          <View>
            <Text style={styles.label}>{t('profile.edit.usernameLabel')}</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder={t('profile.edit.usernamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }, 120);
              }}
            />
          </View>

          <View>
            <Text style={styles.label}>{t('profile.edit.emailLabel')}</Text>
            <TextInput
              value={email}
              editable={false}
              style={[styles.input, styles.inputDisabled]}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, savingProfile && { opacity: 0.7 }]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionText}>{t('profile.edit.saveProfileButton')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.warningCard]}>
          <Text style={[styles.sectionTitle, styles.warningTitle]}>
            {t('profile.edit.passwordSectionTitle')}
          </Text>
          <Text style={styles.warningText}>
            {t('profile.edit.passwordWarning')}
          </Text>

          <View>
            <Text style={styles.label}>{t('profile.edit.currentPasswordLabel')}</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t('profile.edit.currentPasswordPlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 120);
              }}
            />
          </View>

          <View>
            <Text style={styles.label}>{t('profile.edit.newPasswordLabel')}</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('profile.edit.newPasswordPlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 120);
              }}
            />
          </View>

          <View>
            <Text style={styles.label}>{t('profile.edit.confirmPasswordLabel')}</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('profile.edit.confirmPasswordPlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 120);
              }}
            />
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger, savingPassword && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionText}>{t('profile.edit.changePasswordButton')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
