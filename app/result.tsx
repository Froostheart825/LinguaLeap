import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../constants/theme';
import { StarRating } from '../components/feature/StarRating';
import { AchievementToast } from '../components/AchievementToast';
import { Achievement } from '../services/achievementService';
import {
  checkAndUnlockAchievements, getPerfectScoresCount, incrementPerfectScores,
  getFlashcardsReviewedCount,
} from '../services/achievementService';
import { useUser } from '../hooks/useUser';
import { useLessons } from '../hooks/useLessons';
import { LESSON_STATUS } from '../constants/config';
import { useCountUp } from '../hooks/useCountUp';
import { useAnimatedMount } from '../hooks/useAnimatedMount';
import { playCompleteSound, playStreakSound } from '../services/soundService';

export default function ResultScreen() {
  const {
    lessonId, score, xpGained, stars, correctCount, totalCount, timeTaken,
  } = useLocalSearchParams<{
    lessonId: string; score: string; xpGained: string; stars: string;
    correctCount: string; totalCount: string; timeTaken: string;
  }>();
  const router = useRouter();
  const { user } = useUser();
  const { progress } = useLessons();

  const scoreNum = parseInt(score || '0');
  const xpNum = parseInt(xpGained || '0');
  const starsNum = parseInt(stars || '0');
  const correct = parseInt(correctCount || '0');
  const total = parseInt(totalCount || '0');
  const time = parseInt(timeTaken || '0');

  // Count-up animations
  const displayScore = useCountUp(scoreNum, 1200);
  const displayXp = useCountUp(xpNum, 1000);

  // Scale in hero
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  // XP float animation
  const xpFloatY = useRef(new Animated.Value(0)).current;
  const xpFloatOpacity = useRef(new Animated.Value(1)).current;

  // Staggered stats cards
  const stat0 = useAnimatedMount(600);
  const stat1 = useAnimatedMount(750);
  const stat2 = useAnimatedMount(900);

  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null);
  const achievementQueue = useRef<Achievement[]>([]);

  const showNextToast = () => {
    if (achievementQueue.current.length === 0) return;
    const next = achievementQueue.current.shift()!;
    setToastAchievement(next);
    setTimeout(() => {
      setToastAchievement(null);
      setTimeout(() => showNextToast(), 300);
    }, 3500);
  };

  useEffect(() => {
    // Hero spring in
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();

    // XP float up animation (starts 500ms after mount)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(xpFloatY, { toValue: -40, duration: 1200, useNativeDriver: true }),
        Animated.timing(xpFloatOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]).start();
    }, 500);

    // Check achievements
    const runAchievements = async () => {
      if (!user) return;
      try {
        if (scoreNum === 100) await incrementPerfectScores();
        const perfectScores = await getPerfectScoresCount();
        const flashcardsReviewed = await getFlashcardsReviewedCount();
        const completedLessons = progress.filter(p => p.status === LESSON_STATUS.COMPLETED).length;

        const newOnes = await checkAndUnlockAchievements({
          streak: user.currentStreak,
          totalXp: user.totalXp,
          lessonsCompleted: completedLessons,
          perfectScores,
          wordsLearned: user.wordsLearned || 0,
          flashcardsReviewed,
        });

        // Play appropriate sounds
        if (scoreNum >= 100) await playCompleteSound();
        if (user.currentStreak >= 3) await playStreakSound();

        if (newOnes.length > 0) {
          achievementQueue.current = [...newOnes];
          setTimeout(() => showNextToast(), 1500);
        }
      } catch {}
    };

    runAchievements();
  }, []);

  const isPass = scoreNum >= 50;
  const emoji = starsNum === 3 ? '🌟' : starsNum === 2 ? '🎉' : starsNum === 1 ? '✅' : '😤';
  const message = starsNum === 3 ? 'Perfect!' : starsNum === 2 ? 'Great job!' : starsNum === 1 ? 'Good effort!' : 'Keep practicing!';

  const mins = Math.floor(time / 60);
  const secs = time % 60;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AchievementToast achievement={toastAchievement} />

      <View style={styles.scroll}>
        {/* Hero */}
        <Animated.View style={[styles.hero, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.message}>{message}</Text>
          <StarRating stars={starsNum} size={32} />

          {/* Score Circle with count-up */}
          <View style={[styles.scoreCircle, { borderColor: isPass ? Colors.primary : Colors.error }]}>
            <Text style={[styles.scoreNum, { color: isPass ? Colors.primary : Colors.error }]}>
              {displayScore}
            </Text>
            <Text style={styles.scorePct}>%</Text>
          </View>
        </Animated.View>

        {/* XP Banner with float animation */}
        <View>
          <View style={[styles.xpBanner, Shadow.md]}>
            <Text style={styles.xpLabel}>XP Earned</Text>
            <Text style={styles.xpValue}>+{displayXp}</Text>
            <Text style={styles.xpIcon}>⚡</Text>
          </View>
          {/* Floating "+XP" overlay */}
          <Animated.View
            pointerEvents="none"
            style={[styles.xpFloat, { transform: [{ translateY: xpFloatY }], opacity: xpFloatOpacity }]}
          >
            <Text style={styles.xpFloatText}>+{xpNum} XP</Text>
          </Animated.View>
        </View>

        {/* Stats Cards — staggered */}
        <View style={[styles.statsCard, Shadow.sm]}>
          <Text style={styles.statsTitle}>Session Summary</Text>
          <View style={styles.statsGrid}>
            <Animated.View style={[styles.statItem, { opacity: stat0.opacity, transform: [{ translateY: stat0.translateY }] }]}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{correct}/{total}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </Animated.View>
            <View style={styles.statDivider} />
            <Animated.View style={[styles.statItem, { opacity: stat1.opacity, transform: [{ translateY: stat1.translateY }] }]}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statValue}>{scoreNum}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </Animated.View>
            <View style={styles.statDivider} />
            <Animated.View style={[styles.statItem, { opacity: stat2.opacity, transform: [{ translateY: stat2.translateY }] }]}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>{mins > 0 ? `${mins}m ` : ''}{secs}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </Animated.View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push({ pathname: '/exercise', params: { lessonId } })}
            style={({ pressed }) => [styles.practiceBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.practiceBtnText}>🔄 Practice Again</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.homeBtnText}>🏠 Go Home</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(tabs)/learn')}
            style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.nextBtnText}>📚 More Lessons →</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: Spacing.xl, paddingBottom: 40, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  emoji: { fontSize: 72 },
  message: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 6,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    marginTop: Spacing.md,
  },
  scoreNum: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold },
  scorePct: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginTop: 8 },
  xpBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.lg,
    width: '100%', marginBottom: Spacing.lg,
  },
  xpLabel: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.semibold },
  xpValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: '#fff' },
  xpIcon: { fontSize: 28 },
  xpFloat: {
    position: 'absolute', top: -20, alignSelf: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  xpFloatText: { color: '#fff', fontWeight: FontWeight.extrabold, fontSize: FontSize.xl },
  statsCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', marginBottom: Spacing.lg },
  statsTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 50, backgroundColor: Colors.border },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  actions: { width: '100%', gap: Spacing.md },
  nextBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', ...Shadow.md },
  nextBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  practiceBtn: { backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  practiceBtnText: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  homeBtn: { backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  homeBtnText: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
