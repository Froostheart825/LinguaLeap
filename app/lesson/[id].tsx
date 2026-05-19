import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated,
  StatusBar, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLessonById, getVocabularyByLesson } from '../../services/lessonService';
import { useLessons } from '../../hooks/useLessons';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../constants/theme';
import { StarRating } from '../../components/feature/StarRating';
import { CATEGORY_ICONS, CATEGORY_LABELS, LESSON_STATUS, DIFFICULTY } from '../../constants/config';
import { Vocabulary } from '../../services/types';
import * as Speech from 'expo-speech';

// ─── Category colour palette ────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  GREETINGS:  '#58CC02',
  DAILY_LIFE: '#FF9600',
  FAMILY:     '#CE82FF',
  WORK:       '#1CB0F6',
  TRAVEL:     '#FF4B4B',
};

const CATEGORY_DARK: Record<string, string> = {
  GREETINGS:  '#46A302',
  DAILY_LIFE: '#E68600',
  FAMILY:     '#B060E0',
  WORK:       '#0E90D0',
  TRAVEL:     '#D93030',
};

// ─── Difficulty stars helper ─────────────────────────────────────────────────
function DifficultyStars({ difficulty }: { difficulty: string }) {
  const map: Record<string, { count: number; label: string; color: string }> = {
    [DIFFICULTY.BEGINNER]:     { count: 1, label: 'Beginner',     color: Colors.primary },
    [DIFFICULTY.INTERMEDIATE]: { count: 2, label: 'Intermediate', color: Colors.secondary },
    [DIFFICULTY.ADVANCED]:     { count: 3, label: 'Advanced',     color: Colors.error },
  };
  const { count, label, color } = map[difficulty] || map[DIFFICULTY.BEGINNER];
  return (
    <View style={[diffStyles.wrap, { backgroundColor: color + '22', borderColor: color + '66' }]}>
      <Text style={[diffStyles.stars, { color }]}>{'★'.repeat(count)}{'☆'.repeat(3 - count)}</Text>
      <Text style={[diffStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const diffStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  stars: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});

// ─── Vocabulary card ─────────────────────────────────────────────────────────
function VocabCard({
  vocab, index, accentColor,
}: {
  vocab: Vocabulary; index: number; accentColor: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const speakScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 260,
      delay: Math.min(index * 60, 500),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSpeak = () => {
    if (speaking) return;
    setSpeaking(true);
    // Button bounce
    Animated.sequence([
      Animated.timing(speakScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(speakScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Speech.speak(vocab.word, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <Animated.View style={[styles.vocabCard, Shadow.sm, { opacity: fadeAnim }]}>
      {/* Number badge */}
      <View style={[styles.numBadge, { backgroundColor: accentColor + '18' }]}>
        <Text style={[styles.numText, { color: accentColor }]}>{index + 1}</Text>
      </View>

      <View style={styles.vocabInner}>
        {/* Word row */}
        <View style={styles.wordRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.word}>{vocab.word}</Text>
            <Text style={[styles.phonetic, { color: accentColor }]}>{vocab.phonetic}</Text>
          </View>
          {/* TTS button */}
          <Animated.View style={{ transform: [{ scale: speakScale }] }}>
            <Pressable
              onPress={handleSpeak}
              style={({ pressed }) => [
                styles.speakBtn,
                { backgroundColor: speaking ? accentColor : accentColor + '18' },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <Text style={styles.speakIcon}>{speaking ? '🔊' : '🔉'}</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Meaning */}
        <View style={[styles.meaningRow, { borderLeftColor: accentColor }]}>
          <Text style={styles.meaning}>{vocab.meaning}</Text>
        </View>

        {/* Example toggle */}
        <Pressable onPress={() => setShowExample(v => !v)} style={styles.exampleToggle}>
          <Text style={[styles.exampleToggleText, { color: accentColor }]}>
            {showExample ? '▲ Hide example' : '▼ Show example'}
          </Text>
        </Pressable>

        {showExample && (
          <View style={styles.exampleBlock}>
            <Text style={styles.exampleSentence}>"{vocab.exampleSentence}"</Text>
            <Text style={styles.exampleTrans}>{vocab.exampleTranslation}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getLessonProgress } = useLessons();

  const lesson = getLessonById(id as string);
  const vocab = getVocabularyByLesson(id as string);
  const progress = getLessonProgress(id as string);

  // Scroll-driven header collapse
  const scrollY = useRef(new Animated.Value(0)).current;
  const HERO_HEIGHT = 260;

  const heroOpacity = scrollY.interpolate({ inputRange: [0, HERO_HEIGHT * 0.6], outputRange: [1, 0], extrapolate: 'clamp' });
  const heroTranslate = scrollY.interpolate({ inputRange: [0, HERO_HEIGHT], outputRange: [0, -30], extrapolate: 'clamp' });
  const stickyTitleOpacity = scrollY.interpolate({ inputRange: [HERO_HEIGHT * 0.5, HERO_HEIGHT * 0.9], outputRange: [0, 1], extrapolate: 'clamp' });

  if (!lesson) return null;

  const isCompleted = progress?.status === LESSON_STATUS.COMPLETED;
  const catColor  = CATEGORY_COLORS[lesson.category] || Colors.primary;
  const catDark   = CATEGORY_DARK[lesson.category]   || Colors.primaryDark;
  const catLabel  = CATEGORY_LABELS[lesson.category]  || lesson.category;
  const catIcon   = CATEGORY_ICONS[lesson.category]   || '📘';

  const startLesson = () =>
    router.push({ pathname: '/exercise', params: { lessonId: lesson.id } });

  return (
    <View style={[styles.root, { backgroundColor: catColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={catColor} />

      {/* ── Sticky nav bar ────────────────────────────────────────────── */}
      <View style={[styles.navBar, { paddingTop: insets.top, backgroundColor: catColor }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        {/* Lesson title fades in as hero scrolls away */}
        <Animated.Text style={[styles.navTitle, { opacity: stickyTitleOpacity }]} numberOfLines={1}>
          {lesson.title}
        </Animated.Text>
        <View style={{ width: 44 }} />
      </View>

      {/* ── Hero band ─────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.hero,
          { height: HERO_HEIGHT, backgroundColor: catColor, opacity: heroOpacity, transform: [{ translateY: heroTranslate }] },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.heroIcon}>{catIcon}</Text>
        <Text style={styles.heroTitle}>{lesson.title}</Text>
        <Text style={styles.heroDesc} numberOfLines={2}>{lesson.description}</Text>

        {/* Meta chips */}
        <View style={styles.heroChips}>
          <View style={[styles.chip, { backgroundColor: catDark + 'CC' }]}>
            <Text style={styles.chipText}>⚡ +{lesson.xpReward} XP</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: catDark + 'CC' }]}>
            <Text style={styles.chipText}>📖 {vocab.length} words</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        style={styles.scroll}
      >
        {/* White sheet starts here — rounded top corners */}
        <View style={[styles.sheet, { marginTop: HERO_HEIGHT - 28 }]}>

          {/* ── Lesson info section ─────────────────────────── */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <DifficultyStars difficulty={lesson.difficulty} />
              <View style={[styles.chip, { backgroundColor: catColor + '22', borderColor: catColor + '55', borderWidth: 1 }]}>
                <Text style={[styles.chipText, { color: catColor }]}>⚡ +{lesson.xpReward} XP</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1 }]}>
                <Text style={[styles.chipText, { color: Colors.textSecondary }]}>📖 {vocab.length} words</Text>
              </View>
            </View>

            {/* Best score row — only if completed */}
            {isCompleted && (
              <View style={[styles.bestScoreRow, { backgroundColor: catColor + '12', borderColor: catColor + '33' }]}>
                <View style={{ gap: 4 }}>
                  <Text style={styles.bestLabel}>Your best score</Text>
                  <Text style={[styles.bestScore, { color: catColor }]}>{progress?.bestScore ?? 0}%</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <StarRating stars={progress?.stars ?? 0} size={20} />
                  <Text style={styles.practiceAgainHint}>Tap below to improve!</Text>
                </View>
              </View>
            )}

            {/* Completion streak */}
            {isCompleted && (progress?.completionCount ?? 0) > 1 && (
              <View style={styles.completionBanner}>
                <Text style={styles.completionText}>
                  🏅 Completed {progress!.completionCount}× · Last {
                    progress!.lastCompletedAt
                      ? new Date(progress!.lastCompletedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                      : '—'
                  }
                </Text>
              </View>
            )}
          </View>

          {/* ── Vocabulary list ──────────────────────────────── */}
          <View style={styles.vocabSection}>
            <View style={styles.vocabHeader}>
              <Text style={styles.sectionTitle}>Vocabulary</Text>
              <View style={[styles.countBadge, { backgroundColor: catColor }]}>
                <Text style={styles.countText}>{vocab.length}</Text>
              </View>
            </View>
            <Text style={styles.vocabHint}>Tap 🔉 to hear pronunciation · Tap a card to see example</Text>

            {vocab.length === 0 ? (
              <View style={styles.emptyVocab}>
                <Text style={styles.emptyVocabIcon}>📭</Text>
                <Text style={styles.emptyVocabText}>No vocabulary for this lesson yet</Text>
              </View>
            ) : (
              vocab.map((v, i) => (
                <VocabCard key={v.id} vocab={v} index={i} accentColor={catColor} />
              ))
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* ── Sticky footer CTA ─────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md), backgroundColor: Colors.background }]}>
        {/* Progress indicator if previously completed */}
        {isCompleted && (
          <View style={styles.footerMeta}>
            <StarRating stars={progress?.stars ?? 0} size={16} />
            <Text style={styles.footerMetaText}>Best: {progress?.bestScore ?? 0}% · Completed {progress?.completionCount}×</Text>
          </View>
        )}
        <Pressable
          onPress={startLesson}
          style={({ pressed }) => [
            styles.startBtn,
            { backgroundColor: catColor },
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            Shadow.md,
          ]}
        >
          <Text style={styles.startBtnText}>
            {isCompleted ? '🔄 Practice Again' : '▶  Start Lesson'}
          </Text>
          <View style={[styles.startBtnBadge, { backgroundColor: catDark }]}>
            <Text style={styles.startBtnBadgeText}>+{lesson.xpReward} XP</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Nav
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    zIndex: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.bold, lineHeight: 24 },
  navTitle: {
    flex: 1, textAlign: 'center',
    fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff',
  },

  // Hero
  hero: {
    position: 'absolute', top: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 48, paddingHorizontal: Spacing.xl,
    gap: Spacing.xs, zIndex: 1,
  },
  heroIcon: { fontSize: 52 },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: '#fff', textAlign: 'center' },
  heroDesc: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 },
  heroChips: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },

  // Chips
  chip: {
    borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },

  // Scroll
  scroll: { flex: 1, zIndex: 2 },
  scrollContent: { flexGrow: 1 },

  // White sheet
  sheet: {
    flex: 1, backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    minHeight: 500,
  },

  // Info section
  infoSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },

  // Best score
  bestScoreRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5,
  },
  bestLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.4 },
  bestScore: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold },
  practiceAgainHint: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },

  // Completion banner
  completionBanner: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  completionText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },

  // Vocab section
  vocabSection: { padding: Spacing.lg },
  vocabHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  countBadge: { borderRadius: Radius.full, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.extrabold },
  vocabHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md, fontStyle: 'italic' },

  // Vocab card
  vocabCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'flex-start', overflow: 'hidden',
  },
  numBadge: {
    width: 36, alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md + 4,
    borderRightWidth: 1, borderRightColor: Colors.border,
  },
  numText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  vocabInner: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  wordRow: { flexDirection: 'row', alignItems: 'flex-start' },
  word: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  phonetic: { fontSize: FontSize.sm, fontStyle: 'italic', marginTop: 2 },
  speakBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  speakIcon: { fontSize: 20 },
  meaningRow: {
    borderLeftWidth: 3, paddingLeft: Spacing.sm, marginTop: 4,
  },
  meaning: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.semibold, lineHeight: 22 },
  exampleToggle: { paddingTop: 4, alignSelf: 'flex-start' },
  exampleToggleText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  exampleBlock: { gap: 2, paddingTop: Spacing.xs },
  exampleSentence: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },
  exampleTrans: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 18 },

  // Empty vocab
  emptyVocab: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  emptyVocabIcon: { fontSize: 40 },
  emptyVocabText: { fontSize: FontSize.base, color: Colors.textSecondary },

  // Footer
  footer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  footerMeta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    justifyContent: 'center',
  },
  footerMetaText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  startBtn: {
    borderRadius: Radius.lg, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
  },
  startBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  startBtnBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  startBtnBadgeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.extrabold },
});
