import { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Modal,
  FlatList,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../features/settings/hooks';
import { getChaptersByComic, getChapterById } from '../../../features/chapters/api';
import { useRoute, useNavigation } from '@react-navigation/native';
import { updateReadingHistory } from '../../../features/bookmarks/api';
import { useAuth } from '../../../features/auth/hooks';
import { ReaderChatbot } from '../../../features/chapters/reader/ReaderChatbot';
import { getMyWallet, unlockChapterById } from '../../../features/payments/api';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 64;

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: { color: colors.textSecondary, marginTop: 12, fontSize: 14 },
    contentArea: { flex: 1 },
    pageContainer: {
      width: width,
      minHeight: width * 1.5,
      backgroundColor: '#000',
      justifyContent: 'center',
    },
    imageLoader: { position: 'absolute', alignSelf: 'center', zIndex: 1 },
    pageImage: { width: width, height: width * 1.5, resizeMode: 'contain' },
    headerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 10,
    },
    headerContent: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
      textAlign: 'center',
    },
    headerButton: {
      padding: 12,
    },
    headerButtonText: {
      fontSize: 32,
      fontWeight: '300',
      color: colors.text,
      lineHeight: 32,
    },
    iconText: { color: colors.primary, fontSize: 22, fontWeight: 'bold' },
    bottomOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      zIndex: 10,
    },
    bottomContent: {
      height: 70,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    navButton: {
      backgroundColor: colors.secondary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 25,
    },
    disabledButton: { opacity: 0.4, backgroundColor: colors.border },
    navButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    modalBackdrop: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
    modalDismissArea: { flex: 1 },
    modalContent: {
      width: '70%',
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: { fontWeight: 'bold', fontSize: 18, color: colors.text },
    sortText: { fontSize: 20, color: colors.primary, fontWeight: 'bold' },
    chapterItem: {
      height: ITEM_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chapterItemActive: { backgroundColor: colors.secondary },
    chapterItemText: { fontSize: 15, color: colors.textSecondary },
    chapterItemTextActive: { color: colors.primary, fontWeight: 'bold' },
    chapterItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    paidStar: { color: '#f59e0b', fontSize: 14, fontWeight: '900' },
    activeIndicator: { color: colors.primary, fontSize: 20 },
    chatbotFab: {
      position: 'absolute',
      bottom: 90,
      right: 20,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    chatbotFabText: { fontSize: 22 },
  });
}

export default function ChapterDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const chapterId = route.params?.chapterId;
  const comicId = route.params?.comicId;
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isAuthenticated } = useAuth();

  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const [chapterModal, setChapterModal] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [imageLoading, setImageLoading] = useState({});
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  const chapterListRef = useRef(null);
  const uiAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const uiVisibleRef = useRef(true);

  const sortedChapters = useMemo(
    () =>
      [...chapters].sort((a, b) =>
        sortOrder === 'asc' ? a.chapterNumber - b.chapterNumber : b.chapterNumber - a.chapterNumber
      ),
    [chapters, sortOrder]
  );

  const currentIndex = chapters.findIndex((c) => c._id === chapter?._id);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getChapterById(chapterId);
        const list = await getChaptersByComic(data.comic._id);
        if (!cancelled) {
          setChapter(data);
          setChapters(list.chapters);
        }
      } catch (err) {
        console.log('Load chapter error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  useEffect(() => {
    let cancelled = false;
    const loadWallet = async () => {
      if (!isAuthenticated) return;
      if (!chapter?.locked) return;
      try {
        const w = await getMyWallet();
        if (!cancelled) setWallet(w);
      } catch {
        if (!cancelled) setWallet(null);
      }
    };
    loadWallet();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, chapter?.locked]);

  useEffect(() => {
    if (chapter && comicId && chapterId) {
      saveReading();
    }
  }, [chapter, comicId, chapterId]);

  const saveReading = async () => {
    try {
      if (!isAuthenticated) return;

      await updateReadingHistory(comicId, chapterId);
    } catch (error) {
      console.log('Save history error:', error);
    }
  };

  useEffect(() => {
    if (!chapterModal || !chapterListRef.current) return;
    const idx = sortedChapters.findIndex((c) => c._id === chapter?._id);
    if (idx < 0) return;
    const timer = setTimeout(() => {
      chapterListRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.5 });
    }, 120);
    return () => clearTimeout(timer);
  }, [chapterModal, sortOrder]);

  useEffect(() => {
    uiVisibleRef.current = uiVisible;
  }, [uiVisible]);

  const animateUI = (show) => {
    setUiVisible(show);
    uiVisibleRef.current = show;
    Animated.timing(uiAnim, {
      toValue: show ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (Math.abs(diff) < 5) return;

    const shouldShow = diff < 0;

    if (shouldShow !== uiVisibleRef.current) {
      animateUI(shouldShow);
    }

    lastScrollY.current = currentY;
  };

  const handleTap = () => {
    animateUI(!uiVisibleRef.current);
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      navigation.replace('ChapterDetail', {
        chapterId: chapters[currentIndex - 1]._id,
        comicId: comicId,
      });
    }
  };

  const goNext = () => {
    if (currentIndex < chapters.length - 1) {
      navigation.replace('ChapterDetail', {
        chapterId: chapters[currentIndex + 1]._id,
        comicId: comicId,
      });
    }
  };

  if (loading || !chapter) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('story.chapter.loading')}</Text>
      </View>
    );
  }

  const handleUnlock = async () => {
    if (!isAuthenticated) {
      Alert.alert(t('common.error'), 'Please login to unlock this chapter.');
      return;
    }

    try {
      setUnlocking(true);
      await unlockChapterById(chapterId);
      const w = await getMyWallet();
      setWallet(w);
      const data = await getChapterById(chapterId);
      setChapter(data);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Unlock failed';
      Alert.alert(t('common.error'), msg);
    } finally {
      setUnlocking(false);
    }
  };

  if (chapter?.locked) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <Text style={[styles.loadingText, { fontWeight: '800', fontSize: 18 }]}>
          Chapter locked
        </Text>
        <Text style={styles.loadingText}>
          Price: {chapter?.priceCoins ?? 5} coins
        </Text>
        {wallet && (
          <Text style={styles.loadingText}>
            Your balance: {wallet?.coinBalance ?? 0} coins
          </Text>
        )}
        <TouchableOpacity
          style={[styles.navButton, unlocking && { opacity: 0.7 }]}
          onPress={handleUnlock}
          disabled={unlocking}
        >
          {unlocking ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.navButtonText}>Unlock</Text>
          )}
        </TouchableOpacity>
        <Text style={[styles.loadingText, { marginTop: 16 }]}>
          Buy coins in Profile → Coins
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CONTENT */}
      <ScrollView
        style={styles.contentArea}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onScroll={handleScroll}
      >
        {(chapter.pages || []).map((page, index) => (
          <TouchableWithoutFeedback key={page.pageNumber} onPress={handleTap}>
            <View style={styles.pageContainer}>
              {imageLoading[index] && (
                <View style={styles.imageLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
              <Image
                source={{ uri: page.imageUrl }}
                style={styles.pageImage}
                onLoadStart={() => setImageLoading((p) => ({ ...p, [index]: true }))}
                onLoadEnd={() => setImageLoading((p) => ({ ...p, [index]: false }))}
              />
            </View>
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>

      {/* HEADER */}
      <Animated.View
        style={[
          styles.headerOverlay,
          {
            opacity: uiAnim,
            transform: [
              {
                translateY: uiAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Text style={styles.headerButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chương {chapter.chapterNumber}</Text>
          <TouchableOpacity onPress={() => setChapterModal(true)}>
            <Text style={styles.iconText}>☰</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* BOTTOM NAV */}
      <Animated.View
        pointerEvents={uiVisible ? 'box-none' : 'none'}
        style={[
          styles.bottomOverlay,
          {
            opacity: uiAnim,
            transform: [
              {
                translateY: uiAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }),
              },
            ],
          },
        ]}
      >
        <View style={styles.bottomContent}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
            onPress={goPrev}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>{t('story.chapter.prev')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentIndex === chapters.length - 1 && styles.disabledButton,
            ]}
            onPress={goNext}
            disabled={currentIndex === chapters.length - 1}
          >
            <Text style={styles.navButtonText}>{t('story.chapter.next')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* CHATBOT FAB */}
      <TouchableOpacity style={styles.chatbotFab} onPress={() => setChatbotVisible(true)}>
        <Text style={styles.chatbotFabText}>🤖</Text>
      </TouchableOpacity>

      {/* CHATBOT MODAL */}
      <ReaderChatbot
        visible={chatbotVisible}
        onClose={() => setChatbotVisible(false)}
        comicId={comicId}
        currentChapterNumber={chapter?.chapterNumber}
      />

      {/* CHAPTER MODAL */}
      <Modal visible={chapterModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setChapterModal(false)}
          />
          <View style={styles.modalContent}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('story.chapter.list')}</Text>
                <TouchableOpacity
                  onPress={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                >
                  <Text style={styles.sortText}>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                ref={chapterListRef}
                data={sortedChapters}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={10}
                getItemLayout={(_, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
                onScrollToIndexFailed={(info) => {
                  setTimeout(() => {
                    chapterListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: false,
                      viewPosition: 0.5,
                    });
                  }, 200);
                }}
                renderItem={({ item }) => {
                  const isActive = item._id === chapter._id;
                  const isPaidChapter = !item?.freeChapter && Number(item?.priceCoins ?? 0) > 0;
                  return (
                    <TouchableOpacity
                      style={[styles.chapterItem, isActive && styles.chapterItemActive]}
                      onPress={() => {
                        setChapterModal(false);
                        if (!isActive) {
                          navigation.replace('ChapterDetail', {
                            chapterId: item._id,
                            comicId: comicId,
                          });
                        }
                      }}
                    >
                      <View style={styles.chapterItemLeft}>
                        <Text
                          style={[styles.chapterItemText, isActive && styles.chapterItemTextActive]}
                        >
                          Chương {item.chapterNumber}
                        </Text>
                        {isPaidChapter && <Text style={styles.paidStar}>★</Text>}
                      </View>
                      {isActive && <Text style={styles.activeIndicator}>•</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
