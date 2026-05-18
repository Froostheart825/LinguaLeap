import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../hooks/useUser';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../constants/theme';

const GOALS = [
  { xp: 10, emoji: '☕', label: 'Casual', desc: '10 XP / day', subDesc: 'A relaxed pace, 5 min/day' },
  { xp: 20, emoji: '📚', label: 'Regular', desc: '20 XP / day', subDesc: 'Steady growth, 10 min/day' },
  { xp: 50, emoji: '🔥', label: 'Serious', desc: '50 XP / day', subDesc: 'Fast progress, 20 min/day' },
];

export default function GoalPickerScreen() {
  const router = useRouter();
  const { updateDailyGoal } = useUser();
  const [selected, setSelected] = useState(20);

  const handleStart = async () => {
    await updateDailyGoal(selected);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🎯</Text>
        <Text style={styles.title}>Set Your Daily Goal</Text>
        <Text style={styles.subtitle}>How much do you want to learn each day?</Text>
      </View>

      <View style={styles.goals}>
        {GOALS.map(g => (
          <Pressable
            key={g.xp}
            onPress={() => setSelected(g.xp)}
            style={({ pressed }) => [
              styles.goalCard,
              selected === g.xp && styles.goalCardActive,
              pressed && { opacity: 0.85 },
              Shadow.sm,
            ]}
          >
            <Text style={styles.goalEmoji}>{g.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.goalLabel, selected === g.xp && styles.goalLabelActive]}>{g.label}</Text>
              <Text style={styles.goalXp}>{g.desc}</Text>
              <Text style={styles.goalSub}>{g.subDesc}</Text>
            </View>
            <View style={[styles.radio, selected === g.xp && styles.radioActive]}>
              {selected === g.xp && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={handleStart} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.btnText}>Start Learning 🚀</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl },
  header: { alignItems: 'center', paddingVertical: Spacing.xl },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  goals: { flex: 1, gap: Spacing.md },
  goalCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md,
    borderWidth: 2, borderColor: Colors.border,
  },
  goalCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  goalEmoji: { fontSize: 36 },
  goalLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  goalLabelActive: { color: Colors.primary },
  goalXp: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.secondary },
  goalSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  btn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', ...Shadow.md, marginTop: Spacing.lg },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
