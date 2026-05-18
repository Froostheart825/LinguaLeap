import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export function StarRating({ stars, size = 20 }: { stars: number; size?: number }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3].map(i => (
        <Text key={i} style={{ fontSize: size, opacity: i <= stars ? 1 : 0.25 }}>⭐</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
