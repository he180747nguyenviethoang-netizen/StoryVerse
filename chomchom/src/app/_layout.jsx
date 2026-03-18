import '../i18n';
import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SettingsProvider } from '../features/settings/store';
import { useSettings } from '../features/settings/hooks';
import { AuthProvider } from '../features/auth/store';
import { useAuth } from '../features/auth/hooks';

SplashScreen.preventAutoHideAsync();


function RootLayoutNav() {
  const { isAuthenticated, isRestoring } = useAuth();
  const { theme, colors } = useSettings();
  const segments = useSegments();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const splashReady = useRef(false);

  useEffect(() => {
    if (isRestoring) return;

    // Hide native splash, then fade out in-app splash
    SplashScreen.hideAsync();

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      splashReady.current = true;
    });

    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isRestoring, router, segments]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Slot />
      {isRestoring && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.splash, { opacity: fadeAnim }]}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    backgroundColor: '#5b21b6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SettingsProvider>
  );
}
