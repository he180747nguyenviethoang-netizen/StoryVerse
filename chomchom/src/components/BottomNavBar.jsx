import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const tabs = [
  { icon: 'home', screen: 'Home', label: 'Home' },
  { icon: 'bookmark', screen: 'Bookmarks', label: 'Bookmarks' },
  { icon: 'user', screen: 'Profile', label: 'Profile' },
];

const BottomNavBar = ({ navigation, active }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map(({ icon, screen }) => {
          const isActive = active === screen;

          return (
            <TouchableOpacity
              key={screen}
              style={[styles.item, isActive && styles.activeItem]}
              onPress={() => navigation.navigate(screen)}
              activeOpacity={0.8}
            >
              <Feather name={icon} size={24} color={isActive ? colors.primary : '#999'} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 40,
    gap: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  item: {
    padding: 10,
    borderRadius: 30,
  },
  activeItem: {
    backgroundColor: '#f3e8ff',
  },
});

export default BottomNavBar;
