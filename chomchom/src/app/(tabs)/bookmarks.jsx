import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../features/settings/hooks';
import FavoritesStory from '../story/favoritesStory';
import HistoryReading from '../story/historyReading';

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    tabContainer: {
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      gap: 8,
    },
    activeTab: {
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
    },
  });
}

export default function Bookmarks() {
  const [tab, setTab] = useState('favorites');
  const { colors, theme } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('bookmarks.title')}</Text>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'favorites' && styles.activeTab]}
            onPress={() => setTab('favorites')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab === 'favorites' ? 'heart' : 'heart-outline'}
              size={20}
              color={tab === 'favorites' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, tab === 'favorites' && styles.activeTabText]}>
              {t('bookmarks.favorites')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tab === 'history' && styles.activeTab]}
            onPress={() => setTab('history')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab === 'history' ? 'time' : 'time-outline'}
              size={20}
              color={tab === 'history' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, tab === 'history' && styles.activeTabText]}>
              {t('bookmarks.history')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {tab === 'favorites' ? <FavoritesStory /> : <HistoryReading />}
      </View>
    </View>
  );
}
