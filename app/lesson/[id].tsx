import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLessonById, getVocabularyByLesson } from '../../services/lessonService';
import { useLessons } from '../../hooks/useLessons';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../constants/theme';
import { DifficultyBadge } from '../../components/ui/Badge';
import { StarRating } from '../../components/feature/StarRating';
import { CATEGORY_ICONS, LESSON_STATUS } from '../../constants/config';
import * as Speech from 'expo-speech';

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getLessonProgress } = useLessons();

  const lesson = getLessonById(id as string);
  const vocab = getVocabularyByLesson(id as string);
  const progress = getLessonProgress(id as string);

  if (!lesson) return null;

  const isCompleted = progress?.status === LESSON_STATUS.COMPLETED;

  const speak = (word: string) => {
    Speech.speak(word, { language: 'en-US', rate: 0.9 });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.category}>{CATEGORY_ICONS[lesson.category]} {lesson.category.replace('_', ' ')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Lesson Info */}
        <View style={[styles.infoCard, Shadow.md]}>
          <Text style={styles.lessonIcon}>{CATEGORY_ICONS[lesson.category] || '📘'}</Text>
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.description}>{lesson.description}</Text>
          <View style={styles.metaRow}>
            <DifficultyBadge difficulty={lesson.difficulty} />
            <Text style={styles.xpText}>⚡ {lesson.xpReward} XP</Text>
            <Text style={styles.wordsText}>📖 {vocab.length} words</Text>
          </View>
          {isCompleted && (
            <View style={styles.starsRow}>
              <Text style={styles.starsLabel}>Your best:</Text>
              <StarRating stars={progress?.stars || 0} />
              <Text style={styles.scoreText}>{progress?.bestScore}%</Text>
            </View>
          )}
        </View>

        {/* Vocabulary Preview */}
        <Text style={styles.sectionTitle}>Vocabulary ({vocab.length})</Text>
        {vocab.map(v => (
          <View key={v.id} style={[styles.vocabCard, Shadow.sm]}>
            <View style={styles.vocabRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.word}>{v.word}</Text>
                <Text style={styles.phonetic}>{v.phonetic}</Text>
                <Text style={styles.meaning}>{v.meaning}</Text>
              </View>
              <Pressable onPress={() => speak(v.word)} style={styles.speakBtn}>
                <Text style={{ fontSize: 22 }}>🔊</Text>
              </Pressable>
            </View>
            <Text style={styles.example}>{v.exampleSentence}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push({ pathname: '/exercise', params: { lessonId: lesson.id } })}
          style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.startBtnText}>
            {isCompleted ? '🔄 Practice Again' : '▶ Start Lesson'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: FontSize.xl, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  category: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  infoCard: { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  lessonIcon: { fontSize: 56 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: '#fff', textAlign: 'center' },
  description: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginTop: Spacing.sm },
  xpText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },
  wordsText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },
  starsRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginTop: Spacing.sm },
  starsLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  scoreText: { fontSize: FontSize.sm, color: '#fff', fontWeight: FontWeight.bold },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  vocabCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  vocabRow: { flexDirection: 'row', alignItems: 'flex-start' },
  word: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  phonetic: { fontSize: FontSize.sm, color: Colors.accentBlue, fontStyle: 'italic', marginTop: 2 },
  meaning: { fontSize: FontSize.base, color: Colors.secondary, fontWeight: FontWeight.semibold, marginTop: 4 },
  speakBtn: { padding: Spacing.sm, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  example: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  footer: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  startBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', ...Shadow.md },
  startBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
