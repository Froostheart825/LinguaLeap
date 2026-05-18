import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAlert } from '@/template';
import { addStreakFreeze } from '../services/userService';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../constants/theme';

interface StreakFreezeCardProps {
  freezeCount: number;
  onFreezeAdded: () => void;
}

export function StreakFreezeCard({ freezeCount, onFreezeAdded }: StreakFreezeCardProps) {
  const { showAlert } = useAlert();

  const handleGetFreeze = () => {
    showAlert(
      'Get a Streak Freeze?',
      'This will protect your streak if you miss a day. You have 1 free freeze available.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get Free Freeze',
          onPress: async () => {
            await addStreakFreeze(1);
            onFreezeAdded();
          },
        },
      ]
    );
  };

  const hasFreeze = freezeCount > 0;

  return (
    <View style={[styles.card, Shadow.sm, hasFreeze ? styles.cardActive : styles.cardInactive]}>
      <View style={styles.left}>
        <Text style={styles.icon}>❄️</Text>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Streak Freeze</Text>
          <Text style={styles.body}>
            {hasFreeze
              ? `You have ${freezeCount} freeze${freezeCount > 1 ? 's' : ''} ready`
              : 'Protect your streak if you miss a day'}
          </Text>
        </View>
      </View>
      {hasFreeze ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>×{freezeCount}</Text>
        </View>
      ) : (
        <Pressable
          onPress={handleGetFreeze}
          style={({ pressed }) => [styles.getBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.getBtnText}>Get Free</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  cardActive: {
    backgroundColor: Colors.accentBlueBg,
    borderColor: Colors.accentBlue + '55',
  },
  cardInactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  icon: { fontSize: 28 },
  textWrap: { flex: 1 },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  body: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
  getBtn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  getBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
});
