import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/ui/SearchBar';
import { getComics, getGenres, getRecommendedComicsByHistory } from '../../features/comics/api';
import { getReadingHistory } from '../../features/bookmarks/api';
import { apiBaseURL } from '../../services/api/axios';
import { useAuth } from '../../features/auth/hooks';
import { useSettings } from '../../features/settings/hooks';
import FilterModal from '../../features/comics/components/FilterModal';
import RecommendedSection from '../../features/comics/components/RecommendedSection';
import RecentlyReadSection from '../../features/comics/components/RecentlyReadSection';
import MainComicList from '../../features/comics/components/MainComicList';
import { useDebounce } from '../../hooks/useDebounce';

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchBarWrapper: {
      backgroundColor: colors.background,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 10,
      paddingBottom: 4,
      zIndex: 10,
      gap: 5,
    },
    searchBarFlex: {
      flex: 1,
    },
    genreBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingBottom: 80,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
      marginTop: 12,
      paddingHorizontal: 16,
    },
    horizontalScroll: {
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    listContent: {
      backgroundColor: colors.card,
      borderRadius: 8,
      marginHorizontal: 16,
    },
    emptyMessage: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    scrollTopBtn: {
      position: 'absolute',
      right: 20,
      bottom: 100,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
  });
}

export default function Home() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [recommendedComics, setRecommendedComics] = useState([]);
  const [recentlyRead, setRecentlyRead] = useState([]);
  const [popularComics, setPopularComics] = useState([]);
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(false);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [genrePressed, setGenrePressed] = useState(false);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [selectedGenres, setSelectedGenres] = useState([]);

  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredComics, setFilteredComics] = useState([]);
  const [filterPage, setFilterPage] = useState(1);
  const [hasMoreFilters, setHasMoreFilters] = useState(true);
  const [isLoadingMoreFilters, setIsLoadingMoreFilters] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const isSearchActive = searchQuery.trim() !== '';

  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef(null);

  const getComicKey = (item, index) => {
    return String(item?.id ?? item?._id ?? item?.slug ?? item?.title ?? `comic-${index}`);
  };

  const naText = t('common.na');

  const normalizeComics = useCallback(
    (comics) =>
      Array.isArray(comics)
        ? comics.map((comic) => ({
            id: comic?._id ?? comic?.id,
            title: comic?.title || naText,
            author: comic?.author || naText,
            cover: comic?.coverImage ?? comic?.cover,
            chapters: comic?.totalChapters,
            views: comic?.views,
          }))
        : [],
    [naText]
  );

  const fetchDefaultRecommended = useCallback(async () => {
    const res = await getComics({ sort: 'viewsDesc', page: 1 });
    return normalizeComics(res?.comics);
  }, [normalizeComics]);

  const fetchRecommended = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        const fallback = await fetchDefaultRecommended();
        setRecommendedComics(fallback);
        return;
      }

      const historyRes = await getReadingHistory();
      const histories = Array.isArray(historyRes)
        ? historyRes
        : Array.isArray(historyRes?.histories)
          ? historyRes.histories
          : Array.isArray(historyRes?.data)
            ? historyRes.data
            : Array.isArray(historyRes?.data?.histories)
              ? historyRes.data.histories
              : [];

      const comicIds = Array.from(
        new Set(
          histories
            .map((history) => history?.comic?._id ?? history?.comic?.id ?? history?.comicId)
            .filter(Boolean)
            .map(String)
        )
      ).slice(0, 10);

      if (comicIds.length === 0) {
        const fallback = await fetchDefaultRecommended();
        setRecommendedComics(fallback);
        return;
      }

      try {
        const recommendRes = await getRecommendedComicsByHistory(comicIds);
        
        const recommended = normalizeComics(recommendRes?.recommendations);
        setRecommendedComics(recommended);
      } catch (recommendError) {
        const status = recommendError?.response?.status;
        if (status === 401 || status === 403) {
          const fallback = await fetchDefaultRecommended();
          setRecommendedComics(fallback);
          return;
        }
        throw recommendError;
      }
    } catch (error) {
      console.log('Failed to fetch recommended comics', {
        baseURL: apiBaseURL,
        error,
      });
      try {
        const fallback = await fetchDefaultRecommended();
        setRecommendedComics(fallback);
      } catch {
        setRecommendedComics([]);
      }
    }
  }, [isAuthenticated, fetchDefaultRecommended, normalizeComics]);

  const fetchPopular = useCallback(async () => {
    try {
      const res = await getComics({ sort: 'likesDesc', page: 1 });
      const comics = res?.comics;
      const normalized = Array.isArray(comics)
        ? comics.map((comic) => ({
          id: comic?._id,
          title: comic?.title || naText,
          author: comic?.author || naText,
          cover: comic?.coverImage,
          chapters: comic?.totalChapters,
          views: comic?.views,
        }))
        : [];
      setPopularComics(normalized);
    } catch (error) {
      console.log('Failed to fetch popular comics', error);
    }
  }, [naText]);

  const fetchReadingHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setRecentlyRead([]);
      return;
    }

    try {
      const res = await getReadingHistory();
      const histories = Array.isArray(res)
        ? res
        : Array.isArray(res?.histories)
          ? res.histories
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.histories)
              ? res.data.histories
              : [];
      const normalizedHistories = Array.isArray(histories)
        ? histories
          .filter((history) => history?.comic?._id || history?.comic?.id)
          .map((history) => ({
            id: history?.comic?._id ?? history?.comic?.id,
            title: history?.comic?.title ?? naText,
            author: history?.comic?.author ?? naText,
            cover: history?.comic?.coverImage ?? history?.comic?.cover,
            chapters: history?.comic?.totalChapters,
            views: history?.comic?.views,
          }))
        : [];

      setRecentlyRead(normalizedHistories);
    } catch (error) {
      console.log('Failed to fetch reading history', error);
    }
  }, [isAuthenticated, naText]);

  useEffect(() => {
    fetchRecommended();
    fetchPopular();
    fetchReadingHistory();
  }, [fetchRecommended, fetchPopular, fetchReadingHistory]);

  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const triggerSearch = async () => {
      setIsSearching(true);
      try {
        const res = await getComics(
          { search: debouncedSearchQuery, limit: 5 },
          { signal: controller.signal }
        );
        const comics = res?.comics;
        const normalized = Array.isArray(comics)
          ? comics.map((comic) => ({
              id: comic?._id,
              title: comic?.title || naText,
              author: comic?.author || naText,
              cover: comic?.coverImage,
              chapters: comic?.totalChapters,
              views: comic?.views,
            }))
          : [];
        setSearchResults(normalized);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('Search failed', error);
        }
      } finally {
        setIsSearching(false);
      }
    };

    triggerSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedSearchQuery, naText]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRecommended();
      fetchPopular();
      fetchReadingHistory();
    });
    return unsubscribe;
  }, [navigation, fetchRecommended, fetchPopular, fetchReadingHistory]);

  const handleApplyFilters = async () => {
    setShowGenreModal(false);
    try {
      const params = {
        page: 1,
        sort: selectedSort,
      };

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      if (selectedGenres.length > 0) {
        params.genres = selectedGenres.join(',');
      }

      const res = await getComics(params);
      const comics = res?.comics;
      const normalized = Array.isArray(comics)
        ? comics.map((comic) => ({
            id: comic?._id,
            title: comic?.title || naText,
            author: comic?.author || naText,
            cover: comic?.coverImage,
            chapters: comic?.totalChapters,
            views: comic?.views,
          }))
        : [];
      setFilteredComics(normalized);
      setIsFiltered(true);
      setFilterPage(1);
      setHasMoreFilters(normalized.length > 0);
    } catch (error) {
      console.log('Failed to apply filters', error);
    }
  };

  const handleClearFilters = () => {
    setSelectedStatus('all');
    setSelectedSort('latest');
    setSelectedGenres([]);
    setIsFiltered(false);
    setFilteredComics([]);
    setFilterPage(1);
    setHasMoreFilters(true);
    setIsLoadingMoreFilters(false);
  };

  const loadMoreFilters = async () => {
    if (isLoadingMoreFilters || !hasMoreFilters || !isFiltered) return;

    setIsLoadingMoreFilters(true);
    try {
      const nextPage = filterPage + 1;
      const params = {
        page: nextPage,
        sort: selectedSort,
      };

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      if (selectedGenres.length > 0) {
        params.genres = selectedGenres.join(',');
      }

      const res = await getComics(params);
      const comics = res?.comics;
      const normalized = Array.isArray(comics)
        ? comics.map((comic) => ({
            id: comic?._id,
            title: comic?.title || naText,
            author: comic?.author || naText,
            cover: comic?.coverImage,
            chapters: comic?.totalChapters,
            views: comic?.views,
          }))
        : [];

      if (normalized.length > 0) {
        setFilteredComics((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const uniqueNewComics = normalized.filter((c) => !existingIds.has(c.id));
          return [...prev, ...uniqueNewComics];
        });
        setFilterPage(nextPage);
      } else {
        setHasMoreFilters(false);
      }
    } catch (error) {
      console.log('Failed to load more filters', error);
    } finally {
      setIsLoadingMoreFilters(false);
    }
  };

  const getFilterTitle = () => {
    const statusMap = {
      all: '',
      completed: t('home.filter.status.completed'),
      ongoing: t('home.filter.status.ongoing'),
    };
    const sortMap = {
      latest: t('home.filter.sort.latest'),
      viewsDesc: t('home.filter.sort.viewsDesc'),
    };

    const statusPart = statusMap[selectedStatus] ? ` ${statusMap[selectedStatus]}` : '';
    const genreNames = genres
      .filter((g) => selectedGenres.includes(g._id))
      .map((g) => g.name)
      .join(', ');
    const genrePart = genreNames
      ? t('home.filter.genrePart', { genres: genreNames })
      : '';
    const sortPart = t('home.filter.sortPart', {
      sort: sortMap[selectedSort] || t('home.filter.sort.latest'),
    });

    return `${t('home.filter.base')}${statusPart}${genrePart}${sortPart}`;
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 150) {
      if (!showScrollTop) setShowScrollTop(true);
    } else {
      if (showScrollTop) setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleStoryPress = (storyId) => {
    navigation.navigate('StoryDetail', { id: storyId });
  };

  const PopularHeader = () => (
    <Text style={styles.sectionTitle}>{t('home.popular')}</Text>
  );

  const ListHeader = () => (
    <>
      <RecommendedSection
        comics={recommendedComics}
        onStoryPress={handleStoryPress}
        getComicKey={getComicKey}
      />
      <RecentlyReadSection
        comics={recentlyRead}
        isAuthenticated={isAuthenticated}
        onStoryPress={handleStoryPress}
        getComicKey={getComicKey}
      />
      <PopularHeader />
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBarFlex}>
          <SearchBar
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.genreBtn,
            (genrePressed || showGenreModal) && { backgroundColor: colors.primary },
          ]}
          onPressIn={() => setGenrePressed(true)}
          onPressOut={() => setGenrePressed(false)}
          onPress={async () => {
            setShowGenreModal(true);
            if (genres.length === 0) {
              setGenresLoading(true);
              try {
                const res = await getGenres();
                const list = Array.isArray(res)
                  ? res
                  : Array.isArray(res?.genres)
                    ? res.genres
                    : [];
                setGenres(list);
              } catch (e) {
                console.log('Failed to fetch genres', e);
              } finally {
                setGenresLoading(false);
              }
            }
          }}
          activeOpacity={1}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="list"
            size={20}
            color={(genrePressed || showGenreModal) ? '#fff' : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={showGenreModal}
        onClose={() => setShowGenreModal(false)}
        genres={genres}
        genresLoading={genresLoading}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
        selectedGenres={selectedGenres}
        setSelectedGenres={setSelectedGenres}
        onApply={handleApplyFilters}
      />

      <MainComicList
        comics={isSearchActive ? searchResults : (isFiltered ? filteredComics : popularComics)}
        isFiltered={isFiltered || isSearchActive}
        filterTitle={isSearchActive ? t('home.searchResultsFor', { query: searchQuery }) : getFilterTitle()}
        onClearFilters={isSearchActive ? () => setSearchQuery('') : handleClearFilters}
        onStoryPress={handleStoryPress}
        ListHeaderComponent={isSearchActive ? null : <ListHeader />}
        getComicKey={getComicKey}
        onEndReached={isSearchActive ? null : loadMoreFilters}
        isLoadingMore={isSearchActive ? isSearching : isLoadingMoreFilters}
        onScroll={handleScroll}
        flatListRef={flatListRef}
      />

      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopBtn}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
