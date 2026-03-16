import React, { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import { TabNavigationProvider } from './tabContext';
import Home from '../app/(tabs)/home';
import Bookmarks from '../app/(tabs)/bookmarks';
import Profile from '../app/(tabs)/profile';
import StoryDetail from '../app/story/[id]';
import ChapterDetail from '../app/story/chapter/[id]';
import SettingsScreen from '../app/settings';
import EditProfileScreen from '../app/edit-profile';
import LoginScreen from '../app/(auth)/login';
import RegisterScreen from '../app/(auth)/register';
import ForgotPasswordScreen from '../app/(auth)/forgot-password';
import VerifyOtpScreen from '../app/(auth)/verify-otp';
import ResetPasswordScreen from '../app/(auth)/reset-password';

const Stack = createStackNavigator();

const TabRenderScene = SceneMap({
  Home,
  Bookmarks,
  Profile,
});

const routes = [
  { key: 'Home', title: 'Home', component: Home },
  { key: 'Bookmarks', title: 'Bookmarks', component: Bookmarks },
  { key: 'Profile', title: 'Profile', component: Profile },
];

const TabNavigator = ({ route }) => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const currentRoute = routes[index].key;

  const handleNavigation = (screenName) => {
    const routeIndex = routes.findIndex((r) => r.key === screenName);
    if (routeIndex !== -1) {
      setIndex(routeIndex);
    }
  };

  useEffect(() => {
    const targetTab = route?.params?.screen ?? route?.params?.tab;
    if (!targetTab) return;
    handleNavigation(targetTab);
  }, [route?.params?.screen, route?.params?.tab]);

  const navigation = {
    navigate: handleNavigation,
  };

  return (
    <TabNavigationProvider
      value={{
        active: currentRoute,
        navigateTab: handleNavigation,
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={TabRenderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          swipeEnabled={false}
          removeClippedSubviews={true}
          renderTabBar={() => null}
        />
        <BottomNavBar navigation={navigation} active={currentRoute} />
      </View>
    </TabNavigationProvider>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="StoryDetail" component={StoryDetail} />
      <Stack.Screen name="ChapterDetail" component={ChapterDetail} />
      <Stack.Screen name="Setting" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
