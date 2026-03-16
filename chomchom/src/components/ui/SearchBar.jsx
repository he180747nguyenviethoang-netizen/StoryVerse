import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useSettings } from '../../features/settings/hooks';

const SearchBar = ({ placeholder = 'Tìm kiếm truyện...', onChangeText, value }) => {
  const { colors } = useSettings();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onChangeText={onChangeText}
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
    borderRadius: 8,
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
});

export default SearchBar;
