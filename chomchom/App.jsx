import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/features/auth/store';
import { SettingsProvider } from './src/features/settings/store';
import { useSettings } from './src/features/settings/hooks';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

function AppContent() {
  const { colors } = useSettings();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      <NavigationContainer>
        <I18nextProvider i18n={i18n}>
          <AppNavigator />
        </I18nextProvider>
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </AuthProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
