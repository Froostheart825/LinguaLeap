import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = Colors.primary, bgColor, size = 'md' }: BadgeProps) {
  const bg = bgColor || color + '22';
  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
}

const DIFFICULTY_COLORS: Record<string, { color: string; bg: string }> = {
  BEGINNER: { color: Colors.primary, bg: Colors.primaryBg },
  INTERMEDIATE: { color: Colors.secondary, bg: Colors.secondaryBg },
  ADVANCED: { color: Colors.error, bg: Colors.errorBg },
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const { color, bg } = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.BEGINNER;
  return <Badge label={difficulty} color={color} bgColor={bg} size="sm" />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  textSm: { fontSize: FontSize.xs },
});
