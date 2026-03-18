import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/hooks';
import { authApi } from '../../features/auth/api';
import { getReadingHistory, getLikedComics } from '../../features/bookmarks/api';
import { useSettings } from '../../features/settings/hooks';
import RegisterScreen from '../(auth)/register';
import LoginScreen from '../(auth)/login';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

// ---------- Unauthenticated view ----------
function GuestView() {
  const [mode, setMode] = useState('login');

  if (mode === 'register') {
    return (
      <View style={{ flex: 1, marginTop: -40 }}>
        <RegisterScreen onSwitchMode={setMode} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, marginTop: -40 }}>
      <LoginScreen onSwitchMode={setMode} />
    </View>
  );
}

// ---------- Authenticated view ----------
function UserProfile() {
  const { user, logout } = useAuth();
  const { colors } = useSettings();
  const { t } = useTranslation();
  const { top: topInset } = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [readingCount, setReadingCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const navigation = useNavigation();
  const prof = useMemo(() => makeStyles(colors), [colors]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadStats = async () => {
        try {
          const [historyRes, likedRes] = await Promise.all([getReadingHistory(), getLikedComics()]);

          const historyList = Array.isArray(historyRes)
            ? historyRes
            : Array.isArray(historyRes?.data)
              ? historyRes.data
              : [];

          const likedList = Array.isArray(likedRes)
            ? likedRes
            : Array.isArray(likedRes?.comics)
              ? likedRes.comics
              : Array.isArray(likedRes?.data)
                ? likedRes.data
                : Array.isArray(likedRes?.data?.comics)
                  ? likedRes.data.comics
                  : [];

          if (!cancelled) {
            setReadingCount(historyList.length);
            setLikedCount(likedList.length);
          }
        } catch (error) {
          if (!cancelled) {
            setReadingCount(0);
            setLikedCount(0);
          }
        }
      };

      loadStats();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const menuItems = [
    { icon: 'person-outline', label: t('profile.menu.editProfile'), route: 'EditProfile' },
    { icon: 'settings-outline', label: t('profile.menu.settings'), route: 'Setting' },
  ];

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

  const initials =
    user?.username || user?.name
      ? (user.username || user.name)
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
      : '?';

  return (
    <ScrollView
      contentContainerStyle={[prof.scroll, { paddingTop: topInset + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={prof.avatarWrap}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={prof.avatarImg} />
        ) : (
          <View style={prof.avatarFallback}>
            <Text style={prof.avatarInitials}>{initials}</Text>
          </View>
        )}
        {user?.provider === 'google' && (
          <View style={prof.providerBadge}>
            <Text style={prof.providerLetter}>G</Text>
          </View>
        )}
      </View>
      <Text style={prof.name}>{user?.username || user?.name}</Text>
      <Text style={prof.email}>{user?.email}</Text>

      {/* Stats */}
      <View style={prof.statsRow}>
        {[
          { label: t('profile.stats.reading'), value: String(readingCount) },
          { label: t('profile.stats.bookmarks'), value: String(likedCount) },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <View style={prof.statItem}>
              <Text style={prof.statValue}>{s.value}</Text>
              <Text style={prof.statLabel}>{s.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={prof.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Menu */}
      <View style={prof.menuSection}>
        {menuItems.map((item, idx, arr) => (
          <TouchableOpacity
            key={item.label}
            style={[prof.menuItem, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={item.route ? () => navigation.navigate(item.route) : undefined}
          >
            <View style={prof.menuIconWrap}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <Text style={prof.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[prof.logoutBtn, isLoggingOut && { opacity: 0.65 }]}
        onPress={handleLogout}
        disabled={isLoggingOut}
        activeOpacity={0.85}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={colors.error} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={prof.logoutText}>{t('auth.logout.button')}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    scroll: {
      flexGrow: 1,
      paddingBottom: 100,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    avatarWrap: {
      position: 'relative',
      marginBottom: 12,
    },
    avatarImg: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: colors.border,
    },
    avatarFallback: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.secondary,
      borderWidth: 3,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontSize: 44,
      fontWeight: '800',
      color: colors.primary,
    },
    providerBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.google,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.white,
    },
    providerLetter: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '900',
    },
    name: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    statsRow: {
      flexDirection: 'row',
      width: '100%',
      marginBottom: 24,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    menuSection: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 20,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    menuIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuLabel: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    logoutBtn: {
      width: '100%',
      height: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.error,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.errorLight,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.error,
    },
  });
}

// ---------- Root ----------
export default function ProfileTab() {
  const { isAuthenticated } = useAuth();
  const { colors } = useSettings();
  const navigation = useNavigation();
  const route = useRoute();

  React.useEffect(() => {
    if (isAuthenticated && route.params?.goBack) {
      navigation.goBack();
    }
  }, [isAuthenticated]);

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }]} edges={[]}>
      {isAuthenticated ? <UserProfile /> : <GuestView />}
    </SafeAreaView>
  );
}
