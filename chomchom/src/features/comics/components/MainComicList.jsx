import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../features/settings/hooks';
import StoryCard from './StoryCard';

function makeStyles(colors) {
  return StyleSheet.create({
    scrollContent: {
      paddingBottom: 80,
    },
    listContent: {
      borderRadius: 8,
      marginHorizontal: 16,
    },
    filteredHeader: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
    },
    filteredTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      lineHeight: 24,
      marginBottom: 8,
    },
    clearFilterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    clearFilterText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    loaderFooter: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

const MainComicList = ({
  comics,
  isFiltered,
  filterTitle,
  onClearFilters,
  onStoryPress,
  ListHeaderComponent,
  getComicKey,
  onEndReached,
  isLoadingMore,
  onScroll,
  flatListRef,
}) => {
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <FlatList
      ref={flatListRef}
      data={comics}
      keyExtractor={getComicKey}
      onScroll={onScroll}
      scrollEventThrottle={16}
      renderItem={({ item }) => (
        <View style={styles.listContent}>
          <StoryCard
            title={item.title}
            author={item.author}
            cover={item.cover}
            chapters={item.chapters}
            views={item.views}
            onPress={() => onStoryPress(String(item.id))}
            variant="horizontal"
          />
        </View>
      )}
      ListHeaderComponent={
        isFiltered ? (
          <View style={styles.filteredHeader}>
            <Text style={styles.filteredTitle}>{filterTitle}</Text>
            <TouchableOpacity onPress={onClearFilters} style={styles.clearFilterBtn}>
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.clearFilterText}>{t('home.goBack')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          ListHeaderComponent
        )
      }
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.loaderFooter}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      nestedScrollEnabled={true}
    />
  );
};

export default MainComicList;
