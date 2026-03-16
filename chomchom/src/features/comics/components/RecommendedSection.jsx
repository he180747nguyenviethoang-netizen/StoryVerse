import React, { useMemo } from 'react';
import { Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../features/settings/hooks';
import StoryCard from './StoryCard';

function makeStyles(colors) {
  return StyleSheet.create({
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 12,
      marginTop: 20,
      paddingHorizontal: 16,
    },
    horizontalScroll: {
      marginBottom: 20,
      paddingHorizontal: 16,
    },
  });
}

const RecommendedSection = ({ comics, onStoryPress, getComicKey }) => {
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!comics || comics.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>{t('home.recommended')}</Text>
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
            onPress={() => onStoryPress(String(item.id))}
            variant="vertical"
          />
        )}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        nestedScrollEnabled={true}
      />
    </>
  );
};

export default RecommendedSection;
