import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, PanResponder, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllVocabulary } from '../services/lessonService';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../constants/theme';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  SM2Card, ReviewQuality,
  calculateNextReview, initSM2CardIfNeeded, saveSM2Card, formatNextReview,
} from '../services/sm2Service';
import {
  checkAndUnlockAchievements, incrementFlashcardsReviewed,
  getFlashcardsReviewedCount,
} from '../services/achievementService';
import { AchievementToast } from '../components/AchievementToast';
import { Achievement } from '../services/achievementService';
import { useUser } from '../hooks/useUser';
import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.35;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [cards] = useState(() => shuffle(getAllVocabulary()).slice(0, 20));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [easy, setEasy] = useState(0);
  const [hard, setHard] = useState(0);
  const [done, setDone] = useState(false);
  const [nextReviewInfo, setNextReviewInfo] = useState<string | null>(null);
  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;
  const swipeOpacity = useRef(new Animated.Value(1)).current;

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
    setIsFlipped(f => !f);
  };

  const nextCard = async (quality: ReviewQuality) => {
    const isEasy = quality >= 2;
    if (isEasy) setEasy(e => e + 1);
    else setHard(h => h + 1);

    // SM-2 update
    const vocab = cards[currentIdx];
    try {
      const sm2Card = await initSM2CardIfNeeded(vocab.id);
      const updated = calculateNextReview(sm2Card, quality);
      await saveSM2Card(updated);
      setNextReviewInfo(formatNextReview(updated));
    } catch {}

    const dir = isEasy ? 1 : -1;
    Animated.parallel([
      Animated.timing(position, { toValue: { x: dir * width, y: 0 }, duration: 300, useNativeDriver: true }),
      Animated.timing(swipeOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(async () => {
      position.setValue({ x: 0, y: 0 });
      swipeOpacity.setValue(1);
      flipAnim.setValue(0);
      setIsFlipped(false);
      setNextReviewInfo(null);

      const next = currentIdx + 1;
      if (next >= cards.length) {
        // Session done — check achievements
        if (user) {
          await incrementFlashcardsReviewed(cards.length);
          const reviewed = await getFlashcardsReviewedCount();
          const newAchievements = await checkAndUnlockAchievements({
            streak: user.currentStreak,
            totalXp: user.totalXp,
            lessonsCompleted: user.lessonsCompleted,
            perfectScores: 0,
            wordsLearned: user.wordsLearned || 0,
            flashcardsReviewed: reviewed,
          });
          if (newAchievements.length > 0) {
            setToastAchievement(newAchievements[0]);
            setTimeout(() => setToastAchievement(null), 3500);
          }
        }
        setDone(true);
      } else {
        setCurrentIdx(next);
      }
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        nextCard(3); // Easy
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        nextCard(1); // Hard
      } else {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      }
    },
  });

  const rotate = position.x.interpolate({ inputRange: [-width / 2, 0, width / 2], outputRange: ['-10deg', '0deg', '10deg'] });
  const easyOpacity = position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1] });
  const hardOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0] });

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const card = cards[currentIdx];

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <AchievementToast achievement={toastAchievement} />
        <View style={styles.doneScreen}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Session Complete!</Text>
          <Text style={styles.doneSub}>You reviewed {cards.length} flashcards</Text>
          <View style={styles.donStats}>
            <View style={styles.donStat}>
              <Text style={styles.donStatVal}>{easy}</Text>
              <Text style={styles.donStatLabel}>Easy ✓</Text>
            </View>
            <View style={styles.donStat}>
              <Text style={[styles.donStatVal, { color: Colors.error }]}>{hard}</Text>
              <Text style={styles.donStatLabel}>Hard ✗</Text>
            </View>
          </View>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.doneBtnText}>← Back to Vocabulary</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AchievementToast achievement={toastAchievement} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Flashcards</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.easyScore}>{easy}✓</Text>
          <Text style={styles.hardScore}>{hard}✗</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <ProgressBar progress={currentIdx / cards.length} />
        <Text style={styles.progressText}>{currentIdx + 1} / {cards.length}</Text>
      </View>

      {/* Swipe Labels */}
      <View style={styles.swipeLabels}>
        <Animated.View style={[styles.hardLabel, { opacity: hardOpacity }]}>
          <Text style={styles.hardLabelText}>✗ Hard</Text>
        </Animated.View>
        <Animated.View style={[styles.easyLabel, { opacity: easyOpacity }]}>
          <Text style={styles.easyLabelText}>Easy ✓</Text>
        </Animated.View>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.cardOuter, { transform: [...position.getTranslateTransform(), { rotate }], opacity: swipeOpacity }]}
        >
          <Pressable onPress={flipCard} activeOpacity={1}>
            {/* Front */}
            <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
              <Text style={styles.cardTag}>English</Text>
              <Text style={styles.cardWord}>{card.word}</Text>
              <Text style={styles.cardPhonetic}>{card.phonetic}</Text>
              <Pressable onPress={() => Speech.speak(card.word, { language: 'en-US' })} style={styles.speakBtn}>
                <Text style={styles.speakIcon}>🔊</Text>
              </Pressable>
              <Text style={styles.tapHint}>Tap to reveal meaning</Text>
            </Animated.View>
            {/* Back */}
            <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backRotate }] }]}>
              <Text style={styles.cardTag}>Vietnamese</Text>
              <Text style={styles.backMeaning}>{card.meaning}</Text>
              <Text style={styles.backExample}>"{card.exampleSentence}"</Text>
              <Text style={styles.backExampleTrans}>{card.exampleTranslation}</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Next review info */}
      {nextReviewInfo && (
        <Text style={styles.nextReviewText}>Next review: {nextReviewInfo}</Text>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable onPress={() => nextCard(0)} style={[styles.actionBtn, styles.againBtn]}>
          <Text style={styles.againBtnText}>↩ Again</Text>
        </Pressable>
        <Pressable onPress={() => nextCard(1)} style={[styles.actionBtn, styles.hardBtn]}>
          <Text style={styles.hardBtnText}>✗ Hard</Text>
        </Pressable>
        <Pressable onPress={flipCard} style={styles.flipBtn}>
          <Text style={styles.flipBtnText}>Flip</Text>
        </Pressable>
        <Pressable onPress={() => nextCard(2)} style={[styles.actionBtn, styles.goodBtn]}>
          <Text style={styles.goodBtnText}>✓ Good</Text>
        </Pressable>
        <Pressable onPress={() => nextCard(3)} style={[styles.actionBtn, styles.easyBtn]}>
          <Text style={styles.easyBtnText}>★ Easy</Text>
        </Pressable>
      </View>

      <Text style={styles.swipeHint}>← Hard · Swipe · Easy →</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  title: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', gap: Spacing.sm },
  easyScore: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  hardScore: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.error },
  progressWrap: { paddingHorizontal: Spacing.lg, gap: 4 },
  progressText: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right' },
  swipeLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
  hardLabel: { backgroundColor: Colors.errorBg, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  hardLabelText: { color: Colors.error, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  easyLabel: { backgroundColor: Colors.primaryBg, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  easyLabelText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardOuter: { width: width - 48 },
  card: {
    width: '100%', aspectRatio: 0.75, borderRadius: 24, padding: Spacing.xl,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    backfaceVisibility: 'hidden',
    ...Shadow.lg,
  },
  cardFront: { backgroundColor: Colors.primary },
  cardBack: { backgroundColor: Colors.accentBlue, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardTag: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  cardWord: { fontSize: FontSize.display, fontWeight: FontWeight.extrabold, color: '#fff', textAlign: 'center' },
  cardPhonetic: { fontSize: FontSize.lg, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
  speakBtn: { padding: Spacing.sm, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  speakIcon: { fontSize: 28 },
  tapHint: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', marginTop: Spacing.md },
  backMeaning: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: '#fff', textAlign: 'center' },
  backExample: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', textAlign: 'center' },
  backExampleTrans: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  nextReviewText: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.accentBlue, fontWeight: FontWeight.bold, paddingBottom: Spacing.sm },
  actions: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.xs, alignItems: 'center' },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.lg, alignItems: 'center' },
  againBtn: { backgroundColor: Colors.errorBg, borderWidth: 1.5, borderColor: Colors.error },
  againBtnText: { color: Colors.error, fontWeight: FontWeight.bold, fontSize: FontSize.xs },
  hardBtn: { backgroundColor: Colors.secondaryBg, borderWidth: 1.5, borderColor: Colors.secondary },
  hardBtnText: { color: Colors.secondary, fontWeight: FontWeight.bold, fontSize: FontSize.xs },
  goodBtn: { backgroundColor: Colors.accentBlueBg, borderWidth: 1.5, borderColor: Colors.accentBlue },
  goodBtnText: { color: Colors.accentBlue, fontWeight: FontWeight.bold, fontSize: FontSize.xs },
  easyBtn: { backgroundColor: Colors.primaryBg, borderWidth: 1.5, borderColor: Colors.primary },
  easyBtnText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.xs },
  flipBtn: { backgroundColor: Colors.surface, paddingVertical: 12, paddingHorizontal: Spacing.sm, borderRadius: Radius.lg, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  flipBtnText: { color: Colors.textPrimary, fontWeight: FontWeight.bold, fontSize: FontSize.xs },
  swipeHint: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, paddingBottom: Spacing.lg },
  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  doneEmoji: { fontSize: 72 },
  doneTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  doneSub: { fontSize: FontSize.base, color: Colors.textSecondary },
  donStats: { flexDirection: 'row', gap: Spacing.xl },
  donStat: { alignItems: 'center', gap: 4 },
  donStatVal: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  donStatLabel: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: Spacing.xl, ...Shadow.md },
  doneBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
});
