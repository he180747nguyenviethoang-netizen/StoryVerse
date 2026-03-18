import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { fonts } from '../../../theme/fonts';
import { useSettings } from '../../settings/hooks';

export function formatViews(views) {
  if (views == null || isNaN(views)) return '0 views';

  const abs = Math.abs(views);

  const format = (value, suffix) => {
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
    return `${formatted.replace(/\.0$/, '')}${suffix} views`;
  };

  if (abs < 1000) {
    return `${views} views`;
  }

  if (abs < 1_000_000) {
    return format(views / 1_000, 'K');
  }

  if (abs < 1_000_000_000) {
    return format(views / 1_000_000, 'M');
  }

  return format(views / 1_000_000_000, 'B');
}

const StoryCard = ({
  title,
  author,
  cover,
  views,
  chapters,
  onPress,
  variant = 'vertical',
  containerStyle,
  imageStyle,
}) => {
  const { colors } = useSettings();
  const styles = variant === 'vertical' ? makeVerticalStyles(colors) : makeHorizontalStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: cover }} style={[styles.image, imageStyle]} resizeMode="stretch" />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {author}
        </Text>
        {chapters !== undefined && <Text style={styles.meta}>{chapters} chapters</Text>}
        {views !== undefined && <Text style={styles.view}>{formatViews(views)}</Text>}
      </View>
    </TouchableOpacity>
  );
};

function makeVerticalStyles(colors) {
  return StyleSheet.create({
    container: {
      width: 120,
      marginRight: 12,
      marginBottom: 12,
      backgroundColor: colors.background,
    },
    image: {
      width: '100%',
      height: 150,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    content: {
      marginTop: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    author: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: fonts.regular,
    },
    meta: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
      fontFamily: fonts.regular,
    },
    view: {
      fontSize: 12,
      color: '#f59e0b',
      marginTop: 4,
      fontFamily: fonts.regular,
    },
  });
}

function makeHorizontalStyles(colors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginBottom: 12,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    image: {
      width: 100,
      height: 120,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 12,
      justifyContent: 'space-evenly',
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    author: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      fontFamily: fonts.regular,
    },
    meta: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: fonts.regular,
    },
    view: {
      fontSize: 12,
      color: '#f59e0b',
      marginTop: 4,
      fontFamily: fonts.regular,
    },
  });
}

export default StoryCard;
