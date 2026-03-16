import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { getReadingHistory, removeReadingHistory } from '../../features/bookmarks/api';
import StoryCard from '../../features/comics/components/StoryCard';
import { useSettings } from '../../features/settings/hooks';
import { useAuth } from '../../features/auth/hooks';

const { width } = Dimensions.get('window');
const horizontalPadding = 20;
const columnGap = 10;
const columnWidth = (width - horizontalPadding * 2 - columnGap) / 2;

function makeStyles(colors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100,
      paddingHorizontal: 20,
    },
    row: {
      justifyContent: 'space-between',
      paddingHorizontal: horizontalPadding,
    },
    cardWrapper: {
      position: 'relative',
      width: columnWidth,
      marginBottom: 12,
    },
    messageText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
    },
    deleteButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: 'rgba(255, 23, 68, 0.95)',
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
    },
    deleteIcon: {
      color: colors.white,
    },
  });
}

export default function HistoryReading() {
  const navigation = useNavigation();
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isAuthenticated } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setData([]);
        setLoading(false);
        return;
      }

      loadData();
    }, [isAuthenticated])
  );

  const loadData = async () => {
    setLoading(true);

    try {
      const res = await getReadingHistory();
      setData(res || []);
    } catch (error) {
      console.log('Lỗi khi gọi API lịch sử:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (comicId, comicTitle) => {
    Alert.alert(t('history.deleteTitle'), t('history.deleteConfirm', { title: comicTitle }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('history.deleteButton'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeReadingHistory(comicId);

            setData((prevData) => prevData.filter((item) => item?.comic?._id !== comicId));
          } catch (error) {
            Alert.alert(t('common.error'), t('history.deleteError'));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.messageText, { marginTop: 10 }]}>{t('history.loading')}</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.messageText}>{t('history.loginRequired')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      numColumns={2}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ paddingVertical: 10 }}
      columnWrapperStyle={styles.row}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={5}
      removeClippedSubviews
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.messageText}>{t('history.empty')}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const comic = item?.comic;
        if (!comic) return null;

        return (
          <View style={styles.cardWrapper}>
            <StoryCard
              title={comic.title}
              author={comic.author}
              cover={comic.coverImage || comic.cover}
              containerStyle={{ width: '100%' }}
              imageStyle={{ width: '100%' }}
              chapters={
                item?.chapter?.chapterNumber
                  ? t('history.readContinue', {
                      chapter: item.chapter.chapterNumber,
                    })
                  : t('history.startReading')
              }
              variant="vertical"
              onPress={() => navigation.navigate('StoryDetail', { id: comic._id })}
            />

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(comic._id, comic.title)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={14} style={styles.deleteIcon} />
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
}
