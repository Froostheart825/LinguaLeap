import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../hooks/useUser';
import { useLessons } from '../../hooks/useLessons';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StreakFreezeCard } from '../../components/StreakFreezeCard';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../constants/theme';
import { LESSON_STATUS, CATEGORY_ICONS } from '../../constants/config';
import { getStreakFreezeCount } from '../../services/userService';
import { useAnimatedMount } from '../../hooks/useAnimatedMount';
import { usePulseAnimation } from '../../hooks/usePulseAnimation';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { lessons, progress, loadProgress } = useLessons();
  const [freezeCount, setFreezeCount] = useState(0);

  // Staggered mount animations
  const streakAnim = useAnimatedMount(0);
  const xpAnim = useAnimatedMount(100);
  const statsAnim = useAnimatedMount(200);

  // Pulsing streak fire
  const { scale: fireScale } = usePulseAnimation((user?.currentStreak ?? 0) > 0);

  useEffect(() => {
    if (user?.id) {
      loadProgress(user.id);
      getStreakFreezeCount().then(setFreezeCount);
    }
  }, [user?.id]);

  if (!user) return null;

  const todayProgress = Math.min(1, user.todayXp / user.dailyGoalXp);
  const availableLessons = progress.filter(p => p.status === LESSON_STATUS.AVAILABLE || p.status === LESSON_STATUS.IN_PROGRESS);
  const nextLesson = availableLessons.length > 0
    ? lessons.find(l => l.id === availableLessons[0].lessonId)
    : null;
  const completedCount = progress.filter(p => p.status === LESSON_STATUS.COMPLETED).length;

  const levelXpThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  const currentThreshold = levelXpThresholds[user.level - 1] || 0;
  const nextThreshold = levelXpThresholds[user.level] || levelXpThresholds[levelXpThresholds.length - 1];
  const levelProgress = (user.totalXp - currentThreshold) / Math.max(1, nextThreshold - currentThreshold);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day, {user.username}! 👋</Text>
            <Text style={styles.subGreeting}>Ready to learn some English?</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{user.level}</Text>
          </View>
        </View>

        {/* Streak & XP Row */}
        <Animated.View style={[styles.statsRow, { opacity: streakAnim.opacity, transform: [{ translateY: streakAnim.translateY }] }]}>
          <View style={[styles.statCard, { backgroundColor: Colors.secondaryBg }]}>
            <Animated.Text style={[styles.statIcon, { transform: [{ scale: fireScale }] }]}>🔥</Animated.Text>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>{user.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.primaryBg }]}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{user.totalXp}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.accentBlueBg }]}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={[styles.statValue, { color: Colors.accentBlue }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
        </Animated.View>

        {/* Daily Goal */}
        <Animated.View style={[styles.card, Shadow.sm, { opacity: xpAnim.opacity, transform: [{ translateY: xpAnim.translateY }] }]}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Daily Goal</Text>
            <Text style={styles.cardSubtitle}>{user.todayXp} / {user.dailyGoalXp} XP</Text>
          </View>
          <ProgressBar progress={todayProgress} height={14} color={todayProgress >= 1 ? Colors.primary : Colors.secondary} />
          {todayProgress >= 1 && (
            <Text style={styles.goalReached}>🎉 Daily goal reached!</Text>
          )}
        </Animated.View>

        {/* Streak Freeze Card */}
        <Animated.View style={{ opacity: xpAnim.opacity, transform: [{ translateY: xpAnim.translateY }] }}>
          <StreakFreezeCard
            freezeCount={freezeCount}
            onFreezeAdded={() => getStreakFreezeCount().then(setFreezeCount)}
          />
        </Animated.View>

        {/* Level Progress */}
        <Animated.View style={[styles.card, Shadow.sm, { opacity: xpAnim.opacity, transform: [{ translateY: xpAnim.translateY }] }]}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Level {user.level} Progress</Text>
            <Text style={styles.cardSubtitle}>{user.totalXp} XP</Text>
          </View>
          <ProgressBar progress={levelProgress} height={10} color={Colors.accentPurple} />
          <Text style={styles.levelHint}>Next level at {nextThreshold} XP</Text>
        </Animated.View>

        {/* Continue Learning */}
        {nextLesson && (
          <Animated.View style={{ opacity: statsAnim.opacity, transform: [{ translateY: statsAnim.translateY }] }}>
            <Pressable
              style={({ pressed }) => [styles.continueCard, Shadow.md, pressed && { opacity: 0.9 }]}
              onPress={() => router.push(`/lesson/${nextLesson.id}`)}
            >
              <View style={styles.continueIcon}>
                <Text style={{ fontSize: 32 }}>{CATEGORY_ICONS[nextLesson.category] || '📘'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.continueLabel}>Continue Learning</Text>
                <Text style={styles.continueTitle}>{nextLesson.title}</Text>
                <Text style={styles.continueSub}>{nextLesson.category.replace('_', ' ')} · {nextLesson.xpReward} XP</Text>
              </View>
              <Text style={{ fontSize: 20 }}>▶</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Quick Stats */}
        <Animated.View style={{ opacity: statsAnim.opacity, transform: [{ translateY: statsAnim.translateY }] }}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <View style={[styles.card, Shadow.sm]}>
            <View style={styles.journeyRow}>
              <View style={styles.journeyItem}>
                <Text style={styles.journeyValue}>🏆</Text>
                <Text style={styles.journeyNum}>{user.longestStreak}</Text>
                <Text style={styles.journeyLabel}>Best Streak</Text>
              </View>
              <View style={styles.journeyDivider} />
              <View style={styles.journeyItem}>
                <Text style={styles.journeyValue}>📖</Text>
                <Text style={styles.journeyNum}>{user.wordsLearned || 0}</Text>
                <Text style={styles.journeyLabel}>Words</Text>
              </View>
              <View style={styles.journeyDivider} />
              <View style={styles.journeyItem}>
                <Text style={styles.journeyValue}>⭐</Text>
                <Text style={styles.journeyNum}>{progress.reduce((a, p) => a + p.stars, 0)}</Text>
                <Text style={styles.journeyLabel}>Stars</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  subGreeting: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  levelBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  levelText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  goalReached: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold, marginTop: Spacing.sm, textAlign: 'center' },
  levelHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  continueCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  continueIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  continueLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  continueTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#fff' },
  continueSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  journeyRow: { flexDirection: 'row', alignItems: 'center' },
  journeyItem: { flex: 1, alignItems: 'center', gap: 4 },
  journeyDivider: { width: 1, height: 50, backgroundColor: Colors.border },
  journeyValue: { fontSize: 24 },
  journeyNum: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  journeyLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
});
