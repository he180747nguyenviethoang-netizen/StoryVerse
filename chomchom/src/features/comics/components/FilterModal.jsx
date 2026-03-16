import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../features/settings/hooks';

function makeStyles(colors) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 16,
      maxHeight: '75%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    filterSection: {
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    filterSectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    optionChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: colors.white,
      fontWeight: '600',
    },
    modalFooter: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearBtn: {
      backgroundColor: colors.card,
    },
    confirmBtn: {
      backgroundColor: colors.primary,
    },
    clearBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    confirmBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.white,
    },
  });
}

const FilterModal = ({
  visible,
  onClose,
  genres = [],
  genresLoading = false,
  selectedStatus,
  setSelectedStatus,
  selectedSort,
  setSelectedSort,
  selectedGenres = [],
  setSelectedGenres,
  onApply,
}) => {
  const { colors } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleClear = () => {
    setSelectedStatus('all');
    setSelectedSort('latest');
    setSelectedGenres([]);
  };

  const toggleGenre = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter((id) => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  const statusOptions = [
    { label: t('filter.statusAll'), value: 'all' },
    { label: t('filter.statusCompleted'), value: 'completed' },
    { label: t('filter.statusOngoing'), value: 'ongoing' },
  ];

  const sortOptions = [
    { label: t('filter.sortLatest'), value: 'latest' },
    { label: t('filter.sortViews'), value: 'viewsDesc' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalSheet}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('filter.title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('filter.status')}</Text>
              <View style={styles.optionsRow}>
                {statusOptions.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.optionChip,
                      selectedStatus === item.value && styles.optionChipSelected,
                    ]}
                    onPress={() => setSelectedStatus(item.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedStatus === item.value && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('filter.sort')}</Text>
              <View style={styles.optionsRow}>
                {sortOptions.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.optionChip,
                      selectedSort === item.value && styles.optionChipSelected,
                    ]}
                    onPress={() => setSelectedSort(item.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedSort === item.value && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('filter.genre')}</Text>
              {genresLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={styles.optionsRow}>
                  {genres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre._id);
                    return (
                      <TouchableOpacity
                        key={genre._id}
                        style={[
                          styles.optionChip,
                          isSelected && styles.optionChipSelected,
                        ]}
                        onPress={() => toggleGenre(genre._id)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {genre.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerBtn, styles.clearBtn]}
              onPress={handleClear}
            >
              <Text style={styles.clearBtnText}>{t('filter.clear')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerBtn, styles.confirmBtn]}
              onPress={onApply}
            >
              <Text style={styles.confirmBtnText}>{t('filter.apply')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default FilterModal;
