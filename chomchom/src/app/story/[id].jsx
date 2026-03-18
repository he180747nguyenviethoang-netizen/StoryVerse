import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../features/auth/hooks';
import { getReadingHistory, likeComic, getLikedComics } from '../../features/bookmarks/api';
import { getComicDetails, getComicReviews, createReview, updateReview, deleteReview } from '../../services/api/comics';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../features/settings/hooks';

const { width } = Dimensions.get('window');

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 10,
    },
    headerButton: {
      padding: 10,
    },
    headerButtonText: {
      fontSize: 32,
      fontWeight: '300',
      color: colors.text,
      lineHeight: 32,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'left',
      paddingHorizontal: 8,
    },
    scrollView: {
      flex: 1,
      paddingBottom: 20,
    },
    heroSection: {
      width: width,
      height: 280,
      position: 'relative',
    },
    coverImage: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    heroContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 16,
      paddingBottom: 24,
    },
    coverImageSmall: {
      width: 120,
      height: 170,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    heroInfo: {
      flex: 1,
      marginLeft: 16,
      marginBottom: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 6,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    author: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: 8,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingStars: {
      fontSize: 16,
      color: '#fbbf24',
      marginRight: 4,
    },
    ratingValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
    },
    ratingDivider: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: 8,
    },
    viewsValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
    },
    viewsLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.background,
      marginTop: -20,
      marginHorizontal: 16,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    statValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    genresRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    genreBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.secondary,
    },
    genreText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginTop: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
    },
    tabContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    overviewItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    overviewLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },
    overviewValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flex: 2,
      textAlign: 'right',
    },
    descriptionSection: {
      paddingVertical: 16,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    readMore: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 8,
    },
    chaptersSection: {
      marginTop: 16,
    },
    chaptersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    chaptersHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sortButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    sortButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    chapterCountBadge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    chapterCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    chaptersList: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
    chapterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chapterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    chapterNumberBadge: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    chapterNumber: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    chapterInfo: {
      flex: 1,
    },
    chapterTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    chapterTime: {
      fontSize: 12,
      color: colors.textMuted,
    },
    chapterRight: {
      marginLeft: 8,
    },
    chapterArrow: {
      fontSize: 20,
      color: colors.textMuted,
      fontWeight: '300',
    },
    actionSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: 34,
      gap: 12,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    readButton: {
      flex: 1.5,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    readButtonIcon: {
      fontSize: 14,
      color: colors.white,
      marginRight: 8,
    },
    readButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
    },
    followButton: {
      flex: 1,
      backgroundColor: colors.card,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    followedButton: {
      backgroundColor: colors.secondary,
      borderColor: colors.primary,
    },
    followButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    followedText: {
      color: colors.primary,
    },
    reviewHeader: {
      marginBottom: 16,
      paddingTop: 8,
    },
    reviewHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reviewTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    reviewStar: {
      fontSize: 16,
      color: '#f59e0b',
      marginLeft: 8,
    },
    reviewCount: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    writeReview: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 16,
      gap: 8,
    },
    writeReviewTop: {
      flex: 1,
      gap: 8,
    },
    starRating: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    starIcon: {
      fontSize: 24,
      color: colors.border,
      marginRight: 4,
    },
    starIconActive: {
      color: '#f59e0b',
    },
    reviewInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      maxHeight: 80,
    },
    sendButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
    },
    sendButtonText: {
      color: colors.white,
      fontWeight: '600',
    },
    reviewsList: {
      marginTop: 8,
    },
    reviewItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    reviewAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    reviewContent: {
      flex: 1,
    },
    reviewHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    reviewUser: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    reviewDate: {
      fontSize: 12,
      color: colors.textMuted,
    },
    reviewStars: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    reviewStarIcon: {
      fontSize: 12,
      color: colors.border,
      marginRight: 2,
    },
    reviewStarActive: {
      color: '#f59e0b',
    },
    reviewText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    reviewPlaceholder: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: 24,
    },
    inlineActionSection: {
      flexDirection: 'row',
      marginVertical: 12,
      gap: 12,
    },
  });
}

export default function StoryDetail() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { t, i18n } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const comicId = route.params?.id;

  const [lastChapterId, setLastChapterId] = useState(null);
  const [comic, setComic] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [chapterSortOrder, setChapterSortOrder] = useState('desc');
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const contentScrollRef = useRef(null);

  const lastChapter = useMemo(() => {
    if (!lastChapterId || chapters.length === 0) return null;
    return chapters.find((chap) => chap._id === lastChapterId);
  }, [lastChapterId, chapters]);

  const sortedChapters = useMemo(() => {
    const list = [...chapters];
    list.sort((a, b) => {
      const aNumber = Number(a?.chapterNumber) || 0;
      const bNumber = Number(b?.chapterNumber) || 0;
      return chapterSortOrder === 'desc' ? bNumber - aNumber : aNumber - bNumber;
    });
    return list;
  }, [chapters, chapterSortOrder]);

  // Keep the last read chapter in sync on mount and whenever this screen regains focus.
  useEffect(() => {
    let cancelled = false;

    const loadHistoryOnFocus = async () => {
      if (!isAuthenticated || !comicId) {
        if (!cancelled) setLastChapterId(null);
        return;
      }

      try {
        const historyList = await getReadingHistory();
        const history = historyList.find((item) => item?.comic?._id === comicId);
        if (!cancelled) {
          setLastChapterId(history?.chapter?._id || null);
        }
      } catch (error) {
        console.log('Load history on focus error:', error);
      }
    };

    loadHistoryOnFocus();
    const unsubscribe = navigation.addListener('focus', loadHistoryOnFocus);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [comicId, isAuthenticated, navigation]);

  const getStatusText = (status) => {
    if (status === 'completed') return t('story.status.completed');
    if (status === 'ongoing') return t('story.status.ongoing');
    return '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const normalizeReviews = useCallback((value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.reviews)) return value.reviews;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.data?.reviews)) return value.data.reviews;
    return [];
  }, []);

  const refreshReviewsAndRating = useCallback(async () => {
    const reviewsRes = await getComicReviews(comicId);
    const nextReviews = normalizeReviews(reviewsRes);
    setReviews(nextReviews);

    const totalRating = nextReviews.reduce((sum, item) => sum + (Number(item?.rating) || 0), 0);
    const nextRating = nextReviews.length > 0 ? totalRating / nextReviews.length : 0;

    setComic((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rating: nextRating,
      };
    });
  }, [comicId, normalizeReviews]);

  const fetchComicDetails = useCallback(async () => {
    if (!comicId) {
      setLoading(false);
      return;
    }

    const fetchComicDetails = async () => {
      try {
        const [comicRes, reviewsRes] = await Promise.all([
          getComicDetails(comicId),
          getComicReviews(comicId),
        ]);
        const comicData = comicRes?.comic || comicRes;
        setComic(comicData);
        setChapters(comicData?.chapters || []);
        setReviews(normalizeReviews(reviewsRes));
        setIsLiked((prev) =>
          typeof comicRes?.isLiked === 'boolean' ? comicRes.isLiked : prev
        );
      } catch (error) {
        console.log('Failed to fetch comic details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComicDetails();
    try {
      const [comicRes, reviewsRes] = await Promise.all([
        getComicDetails(comicId),
        getComicReviews(comicId),
      ]);
      const comicData = comicRes?.comic || comicRes;
      setComic(comicData);
      setChapters(comicData?.chapters || []);
      setReviews(normalizeReviews(reviewsRes));
      setIsLiked((prev) =>
        typeof comicRes?.isLiked === 'boolean' ? comicRes.isLiked : prev
      );
    } catch (error) {
      console.log('Failed to fetch comic details', error);
    } finally {
      setLoading(false);
    }
  }, [comicId, normalizeReviews]);

  useEffect(() => {
    fetchComicDetails();
  }, [fetchComicDetails]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchComicDetails();
    });
    return unsubscribe;
  }, [navigation, fetchComicDetails]);

  useEffect(() => {
    if (!isAuthenticated || !comicId) return;
    let cancelled = false;

    const syncLikedState = async () => {
      try {
        const res = await getLikedComics();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.comics)
            ? res.comics
            : Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res?.data?.comics)
                ? res.data.comics
                : [];
        const liked = list.some((item) => {
          const id = item?.comic?._id ?? item?._id ?? item?.id;
          return String(id) === String(comicId);
        });
        if (!cancelled) setIsLiked(liked);
      } catch (error) {
        console.log('Failed to sync liked state', error);
      }
    };

    syncLikedState();
    return () => {
      cancelled = true;
    };
  }, [comicId, isAuthenticated]);
  const handleChapterPress = (chapterId) => {
    navigation.navigate('ChapterDetail', { chapterId, comicId });
  };

  const handleReadNow = () => {
    const targetId = (isAuthenticated && lastChapterId) ? lastChapterId : chapters[0]?._id;
    if (targetId) {
      navigation.navigate('ChapterDetail', { chapterId: targetId, comicId });
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để theo dõi truyện này!');
      return;
    }

    try {
      setIsLiked((prev) => !prev);
      await likeComic(comicId);
    } catch (error) {
      console.log('Toggle follow error:', error);
      setIsLiked((prev) => !prev);
      Alert.alert(t('common.error'), t('story.detail.followError'));
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để viết đánh giá!');
      return;
    }
    if (!reviewText.trim() || reviewRating === 0) return;
    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, reviewText, reviewRating);
        setEditingReviewId(null);
      } else {
        await createReview(comicId, reviewText, reviewRating);
      }
      await refreshReviewsAndRating();
      setReviewText('');
      setReviewRating(0);
    } catch {
      // silent
    }
  };

  const handleEditReview = (review) => {
    setReviewText(review.content);
    setReviewRating(review.rating || 0);
    setEditingReviewId(review._id || review.id);
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      'Xóa đánh giá',
      'Bạn có chắc muốn xóa đánh giá này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(reviewId);
              await refreshReviewsAndRating();
            } catch {
              // silent
            }
          },
        },
      ]
    );
  };

  const readButtonLabel = isAuthenticated
    ? lastChapter
      ? t('story.detail.readContinue', { chapter: lastChapter.chapterNumber })
      : lastChapterId
        ? t('common.loading')
        : t('story.detail.readNow')
    : t('story.detail.readNow');

  const renderChapter = ({ item }) => {
    return (
      <TouchableOpacity
        key={item._id || item.id}
        style={styles.chapterItem}
        onPress={() => handleChapterPress(item._id || item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.chapterLeft}>
          <View style={styles.chapterNumberBadge}>
            <Text style={styles.chapterNumber}>{item.chapterNumber}</Text>
          </View>
          <View style={styles.chapterInfo}>
            <Text style={styles.chapterTitle}>{item.title}</Text>
            <Text style={styles.chapterTime}>{formatDate(item.updatedAt)}</Text>
          </View>
        </View>
        <View style={styles.chapterRight}>
          <Text style={styles.chapterArrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {comic?.title || t('story.detail.defaultTitle')}
        </Text>
      </View>

      <ScrollView
        ref={contentScrollRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: activeTab !== 'chapter' ? 120 : 20 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section with Cover */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: comic?.coverImage || comic?.cover }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Image
              source={{ uri: comic?.coverImage || comic?.cover }}
              style={styles.coverImageSmall}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.title} numberOfLines={2}>
                {comic?.title}
              </Text>
              <Text style={styles.author}>{comic?.author}</Text>

              {/* Rating Stars */}
              <View style={styles.ratingRow}>
                <Text style={styles.ratingStars}>★</Text>
                <Text style={styles.ratingValue}>{String(comic?.rating?.toFixed(1) || '0.0')}</Text>
                <Text style={styles.ratingDivider}>|</Text>
                <Text style={styles.viewsValue}>{comic?.views?.toLocaleString() || '0'}</Text>
                <Text style={styles.viewsLabel}> {t('story.detail.reads')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{chapters?.length || '0'}</Text>
            <Text style={styles.statLabel}>{t('story.overview.chapters')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getStatusText(comic?.status)}</Text>
            <Text style={styles.statLabel}>{t('story.detail.status')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDate(comic?.updatedAt) || ''}</Text>
            <Text style={styles.statLabel}>{t('story.detail.updated')}</Text>
          </View>
        </View>

        {/* Tabs: Overview / Chapter / Review */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              {t('story.tabs.overview')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chapter' && styles.tabActive]}
            onPress={() => setActiveTab('chapter')}
          >
            <Text style={[styles.tabText, activeTab === 'chapter' && styles.tabTextActive]}>
              {t('story.detail.tabChapter')} ({chapters.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'review' && styles.tabActive]}
            onPress={() => setActiveTab('review')}
          >
            <Text style={[styles.tabText, activeTab === 'review' && styles.tabTextActive]}>
              {t('story.tabs.reviews')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>{t('story.detail.author')}</Text>
              <Text style={styles.overviewValue}>
                {comic?.author || t('story.detail.updating')}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>{t('story.detail.status')}</Text>
              <Text style={styles.overviewValue}>{getStatusText(comic?.status)}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>{t('story.detail.genre')}</Text>
              <View style={styles.genresRow}>
                {comic?.genres?.map((genre, index) => (
                  <View key={index} style={styles.genreBadge}>
                    <Text style={styles.genreText}>
                      {typeof genre === 'string' ? genre : genre?.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>{t('story.detail.description')}</Text>
              <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 5}>
                {comic?.description || t('story.detail.updating')}
              </Text>
              {comic?.description && comic.description.length > 100 && (
                <TouchableOpacity onPress={() => setShowFullDescription((v) => !v)}>
                  <Text style={styles.readMore}>
                    {showFullDescription ? t('story.detail.collapse') : t('story.detail.expand')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {activeTab === 'chapter' && (
          <View style={styles.tabContent}>
            <View style={styles.inlineActionSection}>
              <TouchableOpacity
                style={styles.readButton}
                onPress={handleReadNow}
                activeOpacity={0.8}
              >
                <Text style={styles.readButtonIcon}>▶</Text>
                <Text style={styles.readButtonText}>{readButtonLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.followButton, isLiked && styles.followedButton]}
                onPress={handleToggleFollow}
                activeOpacity={0.8}
              >
                <Text style={[styles.followButtonText, isLiked && styles.followedText]}>
                  {isLiked ? t('story.detail.following') : t('story.detail.follow')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chaptersSection}>
              <View style={styles.chaptersHeader}>
                <View style={styles.chaptersHeaderLeft}>
                  <Text style={styles.sectionTitle}>{t('story.chapter.list')}</Text>
                  <View style={styles.chapterCountBadge}>
                    <Text style={styles.chapterCountText}>{chapters.length}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.sortButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    setChapterSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                  }
                >
                  <Text style={styles.sortButtonText}>
                    {chapterSortOrder === 'desc' ? '↓' : '↑'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chaptersList}>
                {sortedChapters.map((item) => renderChapter({ item }))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'review' && (
          <View style={styles.tabContent}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewHeaderLeft}>
                <Text style={styles.reviewTitle}>{t('story.detail.reviews')}</Text>
                <Text style={styles.reviewStar}>★</Text>
                <Text style={styles.reviewCount}>{reviews.length}</Text>
              </View>
            </View>
            <View style={styles.writeReview}>
              <View style={styles.writeReviewTop}>
                <View style={styles.starRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                      <Text
                        style={[styles.starIcon, star <= reviewRating && styles.starIconActive]}
                      >
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder={t('story.detail.reviewPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={reviewText}
                  onChangeText={setReviewText}
                  onFocus={() => {
                    setTimeout(() => {
                      contentScrollRef.current?.scrollToEnd({ animated: true });
                    }, 180);
                  }}
                  multiline
                />
              </View>
              {!editingReviewId && (
                <TouchableOpacity style={styles.sendButton} onPress={handleSubmitReview}>
                  <Text style={styles.sendButtonText}>{t('story.detail.send')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {editingReviewId && (
              <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginBottom: 16 }}>
                <TouchableOpacity style={styles.sendButton} onPress={handleSubmitReview}>
                  <Text style={styles.sendButtonText}>{t('Cập nhật')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendButton, { backgroundColor: colors.border }]}
                  onPress={() => {
                    setEditingReviewId(null);
                    setReviewText('');
                    setReviewRating(0);
                  }}
                >
                  <Text style={[styles.sendButtonText, { color: colors.text }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map((review) => {
                  const reviewUserId = review.user?._id || review.user;
                  const isOwnReview = isAuthenticated && currentUser && reviewUserId && String(reviewUserId) === String(currentUser._id);
                  return (
                  <View key={review.id || review._id} style={styles.reviewItem}>
                    <Image source={{ uri: review.user?.avatar }} style={styles.reviewAvatar} />
                    <View style={styles.reviewContent}>
                      <View style={styles.reviewHeaderRow}>
                        <Text style={styles.reviewUser}>{review.user?.username}</Text>
                        {isOwnReview ? (
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity onPress={() => handleEditReview(review)}>
                              <Text style={{ color: colors.primary, fontSize: 13 }}>Sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteReview(review._id || review.id)}>
                              <Text style={{ color: '#ef4444', fontSize: 13 }}>Xóa</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                        )}
                      </View>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text
                            key={star}
                            style={[
                              styles.reviewStarIcon,
                              star <= review.rating && styles.reviewStarActive,
                            ]}
                          >
                            ★
                          </Text>
                        ))}
                      </View>
                      <Text style={styles.reviewText}>{review.content}</Text>
                    </View>
                  </View>
                )})}
              </View>
            ) : (
              <Text style={styles.reviewPlaceholder}>{t('story.detail.noReviews')}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {activeTab !== 'chapter' && (
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.readButton} onPress={handleReadNow} activeOpacity={0.8}>
            <Text style={styles.readButtonIcon}>▶</Text>
            <Text style={styles.readButtonText}>{readButtonLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.followButton, isLiked && styles.followedButton]}
            onPress={handleToggleFollow}
            activeOpacity={0.8}
          >
            <Text style={[styles.followButtonText, isLiked && styles.followedText]}>
              {isLiked ? t('story.detail.following') : t('story.detail.follow')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
