import React from 'react';
import { View, Text } from 'react-native';

export default function ReaderHeader({ title }) {
  return (
    <View>
      <Text>{title ?? 'Chapter'}</Text>
    </View>
  );
}
