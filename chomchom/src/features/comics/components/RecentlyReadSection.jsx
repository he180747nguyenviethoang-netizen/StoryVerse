import React, { useMemo } from 'react';
import { Text, FlatList, StyleSheet, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../features/settings/hooks';
import { useTabNavigation } from '../../../navigation/tabContext';
import StoryCard from './StoryCard';

function makeStyles(colors) {
  return StyleSheet.create({
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 12,
      marginTop: 12,
      paddingHorizontal: 16,
    },
    horizontalScroll: {
      paddingHorizontal: 16,
    },
    emptyMessage: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    emptyMessageRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    emptyMessageText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loginLink: {
      color: colors.primary,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });
}

const RecentlyReadSection = ({ comics, isAuthenticated, onStoryPress, getComicKey }) => {
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tabNavigation = useTabNavigation();

  const handleLoginPress = () => {
    tabNavigation?.navigateTab?.('Profile');
  };

  return (
    <>
      <Text style={styles.sectionTitle}>{t('home.recentlyRead')}</Text>
      {!isAuthenticated ? (
        <View style={styles.emptyMessageRow}>
          <Text style={styles.emptyMessageText}>{t('home.loginRequiredPrefix')}</Text>
          <Pressable onPress={handleLoginPress} hitSlop={8}>
            <Text style={styles.loginLink}>{t('home.loginRequiredLink')}</Text>
          </Pressable>
          <Text style={styles.emptyMessageText}>{t('home.loginRequiredSuffix')}</Text>
        </View>
      ) : comics && comics.length > 0 ? (
        <FlatList
          horizontal
          data={comics}
          keyExtractor={getComicKey}
          renderItem={({ item }) => (
            <StoryCard
              title={item.title}
              author={item.author}
              cover={item.cover}
              chapters={item.chapters}
              views={item.views}
              onPress={() => onStoryPress(item.id)}
              variant="vertical"
            />
          )}
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          nestedScrollEnabled={true}
        />
      ) : (
        <Text style={styles.emptyMessage}>{t('home.noHistory')}</Text>
      )}
    </>
  );
};

export default RecentlyReadSection;
