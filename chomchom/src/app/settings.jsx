import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../features/settings/hooks';
import { useNavigation } from '@react-navigation/native';

function SectionHeader({ label, colors }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
  );
}

function OptionRow({ icon, label, onPress, right, isLast, colors }) {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        { borderBottomColor: colors.border, backgroundColor: colors.card },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme, language, colors, setTheme, setLanguage } = useSettings();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance section */}
        <SectionHeader label={t('settings.appearance.section')} colors={colors} />
        <View style={[styles.card, { borderColor: colors.border }]}>
          <OptionRow
            icon="sunny-outline"
            label={t('settings.appearance.light')}
            onPress={() => setTheme('light')}
            colors={colors}
            right={
              <Switch
                value={theme === 'light'}
                onValueChange={(v) => v && setTheme('light')}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={theme === 'light' ? colors.primary : colors.textMuted}
              />
            }
          />
          <OptionRow
            icon="moon-outline"
            label={t('settings.appearance.dark')}
            onPress={() => setTheme('dark')}
            isLast
            colors={colors}
            right={
              <Switch
                value={theme === 'dark'}
                onValueChange={(v) => v && setTheme('dark')}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={theme === 'dark' ? colors.primary : colors.textMuted}
              />
            }
          />
        </View>

        {/* Language section */}
        <SectionHeader label={t('settings.language.section')} colors={colors} />
        <View style={[styles.card, { borderColor: colors.border }]}>
          <OptionRow
            icon="language-outline"
            label={t('settings.language.vi')}
            onPress={() => setLanguage('vi')}
            colors={colors}
            right={
              language === 'vi' ? (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              ) : null
            }
          />
          <OptionRow
            icon="globe-outline"
            label={t('settings.language.en')}
            onPress={() => setLanguage('en')}
            isLast
            colors={colors}
            right={
              language === 'en' ? (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              ) : null
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
