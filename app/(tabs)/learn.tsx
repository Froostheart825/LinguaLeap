import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Dimensions,
  ScrollView, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../hooks/useUser';
import { useLessons } from '../../hooks/useLessons';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../constants/theme';
import { LESSON_STATUS, CATEGORY_ICONS, CATEGORY_LABELS } from '../../constants/config';
import { StarRating } from '../../components/feature/StarRating';
import { DifficultyBadge } from '../../components/ui/Badge';
import { Lesson } from '../../services/types';
import { usePulseAnimation } from '../../hooks/usePulseAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
  GREETINGS:  '#58CC02',
  DAILY_LIFE: '#FF9600',
  FAMILY:     '#CE82FF',
  WORK:       '#1CB0F6',
  TRAVEL:     '#FF4B4B',
};

const CATEGORY_ORDER = ['GREETINGS', 'DAILY_LIFE', 'FAMILY', 'WORK', 'TRAVEL'];

const NODE_SIZE = 64;
const VERTICAL_SPACING = 130;
const POSITIONS = [0.18, 0.5, 0.82];

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonNode({ index }: { index: number }) {
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const posRatio = POSITIONS[index % 3];
  const xPos = SCREEN_WIDTH * posRatio - NODE_SIZE / 2;
  const yPos = index * VERTICAL_SPACING + 20;

  return (
    <Animated.View
      style={[styles.skeletonNode, { left: xPos, top: yPos, opacity: shimmer }]}
    />
  );
}

// ─── Category Filter Bar ──────────────────────────────────────────────────────
interface FilterBarProps {
  activeFilter: string | null;
  onSelect: (cat: string | null) => void;
}

function CategoryFilterBar({ activeFilter, onSelect }: FilterBarProps) {
  const chips = [
    { key: null, label: 'All', icon: '🌐', color: Colors.textPrimary },
    ...CATEGORY_ORDER.map(cat => ({
      key: cat,
      label: CATEGORY_LABELS[cat] || cat,
      icon: CATEGORY_ICONS[cat] || '📘',
      color: CATEGORY_COLORS[cat] || Colors.primary,
    })),
  ];

  return (
    <View style={filterStyles.outer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.content}
      >
        {chips.map(chip => {
          const isActive = activeFilter === chip.key;
          const chipColor = chip.color;
          return (
            <Pressable
              key={String(chip.key)}
              onPress={() => onSelect(chip.key)}
              style={({ pressed }) => [
                filterStyles.chip,
                isActive
                  ? { backgroundColor: chipColor, borderColor: chipColor }
                  : { backgroundColor: Colors.surface, borderColor: Colors.border },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={filterStyles.chipIcon}>{chip.icon}</Text>
              <Text
                style={[
                  filterStyles.chipLabel,
                  { color: isActive ? '#fff' : Colors.textSecondary },
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const filterStyles = StyleSheet.create({
  outer: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  chipIcon: { fontSize: 14 },
  chipLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});

// ─── Lesson Node ─────────────────────────────────────────────────────────────
function LessonNode({
  lesson, index, status, stars, onPress,
}: {
  lesson: Lesson; index: number; status: string; stars: number; onPress: () => void;
}) {
  const isAvailable = status === LESSON_STATUS.AVAILABLE || status === LESSON_STATUS.IN_PROGRESS;
  const isCompleted = status === LESSON_STATUS.COMPLETED;
  const isLocked = status === LESSON_STATUS.LOCKED;

  const { scale } = usePulseAnimation(isAvailable);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index * 50, 600);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay, useNativeDriver: true }).start();
  }, []);

  const catColor = CATEGORY_COLORS[lesson.category] || Colors.primary;

  const nodeEl = (
    <Pressable onPress={onPress} style={{ alignItems: 'center' }}>
      <View style={[
        styles.node,
        {
          backgroundColor: isLocked ? Colors.lockedBg : catColor,
          borderColor: isLocked ? Colors.border : catColor,
          opacity: isLocked ? 0.5 : 1,
        },
        isCompleted && styles.nodeCompleted,
      ]}>
        <Text style={styles.nodeIcon}>
          {isLocked ? '🔒' : isCompleted ? '✓' : CATEGORY_ICONS[lesson.category] || '📘'}
        </Text>
      </View>
      {isCompleted && (
        <View style={styles.starsBelow}>
          <StarRating stars={stars} size={10} />
        </View>
      )}
      <Text style={[styles.nodeLabel, isLocked && { color: Colors.textMuted }]} numberOfLines={2}>
        {lesson.title}
      </Text>
    </Pressable>
  );

  return (
    <Animated.View style={[styles.nodeWrap, {
      left: SCREEN_WIDTH * POSITIONS[index % 3] - NODE_SIZE / 2,
      top: index * VERTICAL_SPACING + 20,
      opacity: fadeAnim,
    }]}>
      {isAvailable ? (
        <Animated.View style={{ transform: [{ scale }] }}>
          {nodeEl}
        </Animated.View>
      ) : nodeEl}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { lessons, progress, loadProgress } = useLessons();

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Fade-in animation for the path when filter changes
  const pathFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (user?.id) {
      loadProgress(user.id).then(() => setIsLoading(false));
    }
  }, [user?.id]);

  const handleFilterChange = (cat: string | null) => {
    if (cat === activeFilter) return;
    // Fade out → change → fade in
    Animated.timing(pathFade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setActiveFilter(cat);
      Animated.timing(pathFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const getStatus = (lessonId: string) =>
    progress.find(p => p.lessonId === lessonId)?.status || LESSON_STATUS.LOCKED;
  const getBestScore = (lessonId: string) =>
    progress.find(p => p.lessonId === lessonId)?.bestScore || 0;
  const getStars = (lessonId: string) =>
    progress.find(p => p.lessonId === lessonId)?.stars || 0;

  // Filter lessons by selected category
  const visibleLessons = activeFilter
    ? lessons.filter(l => l.category === activeFilter)
    : lessons;

  const totalHeight = visibleLessons.length * VERTICAL_SPACING + 120;
  const completedCount = lessons.filter(l => getStatus(l.id) === LESSON_STATUS.COMPLETED).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.subtitle}>{completedCount} / {lessons.length} completed</Text>
      </View>

      {/* Category filter bar */}
      <CategoryFilterBar activeFilter={activeFilter} onSelect={handleFilterChange} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Active filter hint */}
        {activeFilter && (
          <View style={[styles.filterHint, { backgroundColor: (CATEGORY_COLORS[activeFilter] || Colors.primary) + '14' }]}>
            <Text style={[styles.filterHintText, { color: CATEGORY_COLORS[activeFilter] || Colors.primary }]}>
              {CATEGORY_ICONS[activeFilter]} Showing {CATEGORY_LABELS[activeFilter] || activeFilter} lessons · {visibleLessons.length} total
            </Text>
            <Pressable onPress={() => handleFilterChange(null)} hitSlop={8}>
              <Text style={[styles.filterClearText, { color: CATEGORY_COLORS[activeFilter] || Colors.primary }]}>✕ Clear</Text>
            </Pressable>
          </View>
        )}

        {/* Path canvas */}
        <Animated.View style={[styles.pathCanvas, { height: totalHeight, opacity: pathFade }]}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonNode key={i} index={i} />)
          ) : visibleLessons.length === 0 ? (
            <View style={styles.emptyFilter}>
              <Text style={styles.emptyFilterIcon}>🔍</Text>
              <Text style={styles.emptyFilterText}>No lessons in this category yet</Text>
            </View>
          ) : (
            visibleLessons.map((lesson, index) => {
              const status = getStatus(lesson.id);
              const stars = getStars(lesson.id);
              const catColor = CATEGORY_COLORS[lesson.category] || Colors.primary;
              const isLocked = status === LESSON_STATUS.LOCKED;
              const isFirstInCategory = index === 0 || visibleLessons[index - 1].category !== lesson.category;

              // Connector line to previous node
              let connectorEl: React.ReactNode = null;
              if (index > 0) {
                const prevPosRatio = POSITIONS[(index - 1) % 3];
                const currPosRatio = POSITIONS[index % 3];
                const prevX = SCREEN_WIDTH * prevPosRatio;
                const currX = SCREEN_WIDTH * currPosRatio;
                const dx = currX - prevX;
                const connLen = Math.sqrt(dx * dx + VERTICAL_SPACING * VERTICAL_SPACING);
                const angle = Math.atan2(VERTICAL_SPACING, dx) * (180 / Math.PI);
                connectorEl = (
                  <View
                    style={[
                      styles.connector,
                      {
                        position: 'absolute',
                        left: prevX,
                        top: (index - 1) * VERTICAL_SPACING + 20 + NODE_SIZE / 2,
                        width: connLen,
                        transform: [{ rotate: `${angle}deg` }],
                        opacity: isLocked ? 0.3 : 0.6,
                      } as any,
                    ]}
                  />
                );
              }

              const yPos = index * VERTICAL_SPACING + 20;

              return (
                <React.Fragment key={lesson.id}>
                  {connectorEl}
                  {/* Only show category banner when filter is off (showing all) */}
                  {!activeFilter && isFirstInCategory && (
                    <View style={[styles.categoryBanner, {
                      top: yPos - 36,
                      backgroundColor: catColor + '22',
                      borderColor: catColor + '55',
                    }]}>
                      <Text style={[styles.categoryBannerText, { color: catColor }]}>
                        {CATEGORY_ICONS[lesson.category]} {CATEGORY_LABELS[lesson.category] || lesson.category}
                      </Text>
                    </View>
                  )}
                  <LessonNode
                    lesson={lesson}
                    index={index}
                    status={status}
                    stars={stars}
                    onPress={() => {
                      if (isLocked) {
                        setTooltipText('Complete the previous lesson to unlock!');
                        setTimeout(() => setTooltipText(null), 2000);
                      } else {
                        setSelectedLesson(lesson);
                      }
                    }}
                  />
                </React.Fragment>
              );
            })
          )}
        </Animated.View>

        {tooltipText && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{tooltipText}</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Lesson Detail Bottom Sheet */}
      <Modal
        visible={!!selectedLesson}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLesson(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedLesson(null)} />
        {selectedLesson && (() => {
          const status = getStatus(selectedLesson.id);
          const stars = getStars(selectedLesson.id);
          const bestScore = getBestScore(selectedLesson.id);
          const catColor = CATEGORY_COLORS[selectedLesson.category] || Colors.primary;
          return (
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={[styles.modalIconWrap, { backgroundColor: catColor + '22', borderColor: catColor + '55' }]}>
                <Text style={styles.modalIcon}>{CATEGORY_ICONS[selectedLesson.category] || '📘'}</Text>
              </View>
              <View style={[styles.catBadge, { backgroundColor: catColor }]}>
                <Text style={styles.catBadgeText}>{CATEGORY_LABELS[selectedLesson.category] || selectedLesson.category}</Text>
              </View>
              <Text style={styles.modalTitle}>{selectedLesson.title}</Text>
              <Text style={styles.modalDesc}>{selectedLesson.description}</Text>
              <View style={styles.modalMeta}>
                <DifficultyBadge difficulty={selectedLesson.difficulty} />
                <View style={styles.metaBadge}><Text style={styles.metaBadgeText}>⚡ +{selectedLesson.xpReward} XP</Text></View>
                <View style={styles.metaBadge}><Text style={styles.metaBadgeText}>📖 {selectedLesson.totalWords} words</Text></View>
              </View>
              {status === LESSON_STATUS.COMPLETED && (
                <View style={styles.bestRow}>
                  <Text style={styles.bestLabel}>Best:</Text>
                  <Text style={styles.bestScore}>{bestScore}%</Text>
                  <StarRating stars={stars} size={16} />
                </View>
              )}
              <Pressable
                onPress={() => { setSelectedLesson(null); router.push(`/lesson/${selectedLesson.id}`); }}
                style={({ pressed }) => [styles.startBtn, { backgroundColor: catColor }, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.startBtnText}>
                  {status === LESSON_STATUS.COMPLETED ? '🔄 Practice Again' : '▶ Start Lesson'}
                </Text>
              </Pressable>
            </View>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // Filter hint strip
  filterHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.md, marginTop: Spacing.sm, marginBottom: 2,
    borderRadius: Radius.md, paddingVertical: 7, paddingHorizontal: Spacing.md,
  },
  filterHintText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  filterClearText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Empty filter state
  emptyFilter: {
    position: 'absolute', top: 80, left: 0, right: 0,
    alignItems: 'center', gap: Spacing.md,
  },
  emptyFilterIcon: { fontSize: 40 },
  emptyFilterText: { fontSize: FontSize.base, color: Colors.textSecondary },

  // Path
  pathCanvas: { position: 'relative', width: SCREEN_WIDTH },
  nodeWrap: { position: 'absolute', width: NODE_SIZE + 40, alignItems: 'center' },
  node: {
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
    ...Shadow.md,
  },
  nodeCompleted: { borderWidth: 3 },
  nodeIcon: { fontSize: 24, color: '#fff' },
  starsBelow: { marginTop: 4 },
  nodeLabel: {
    fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textPrimary,
    textAlign: 'center', marginTop: 4, maxWidth: NODE_SIZE + 40, lineHeight: 13,
  },
  skeletonNode: {
    position: 'absolute',
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    backgroundColor: Colors.border,
  },
  connector: { height: 3, backgroundColor: Colors.border, borderRadius: 2 },
  categoryBanner: {
    position: 'absolute',
    left: Spacing.md, right: Spacing.md,
    paddingVertical: 5, paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  categoryBannerText: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tooltip: {
    position: 'absolute', bottom: 20, left: Spacing.xl, right: Spacing.xl,
    backgroundColor: Colors.textPrimary, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center',
  },
  tooltipText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  modalIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  modalIcon: { fontSize: 40 },
  catBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  catBadgeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center' },
  modalDesc: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  modalMeta: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  metaBadge: {
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  metaBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  bestRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  bestLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  bestScore: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.primary },
  startBtn: { width: '100%', borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', ...Shadow.md, marginTop: Spacing.sm },
  startBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
