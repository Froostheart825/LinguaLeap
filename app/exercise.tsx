import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView, Animated,
  KeyboardAvoidingView, Platform, BackHandler,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useUser } from '../hooks/useUser';
import { useLessons } from '../hooks/useLessons';
import { generateExercises, checkAnswer } from '../services/exerciseService';
import { getLessonById } from '../services/lessonService';
import { calculateXp } from '../services/userService';
import { Exercise } from '../services/types';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../constants/theme';
import { EXERCISE_TYPES } from '../constants/config';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ListeningExercise } from '../components/exercises/ListeningExercise';
import { SpeakingExercise } from '../components/exercises/SpeakingExercise';
import { MatchingPairsExercise } from '../components/exercises/MatchingPairsExercise';
import { useShakeAnimation } from '../hooks/useShakeAnimation';
import { useAnimatedMount } from '../hooks/useAnimatedMount';
import { playCorrectSound, playWrongSound, playCompleteSound, stopAllSounds } from '../services/soundService';
import * as Speech from 'expo-speech';

const TOTAL_LIVES = 3;

export default function ExerciseScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user, addXp } = useUser();
  const { completeLesson } = useLessons();

  const [exercises] = useState<Exercise[]>(() => generateExercises(lessonId as string, 10));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [wordBankSelected, setWordBankSelected] = useState<string[]>([]);
  const [wordBankAvailable, setWordBankAvailable] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [specialAnswered, setSpecialAnswered] = useState(false);
  const [specialCorrect, setSpecialCorrect] = useState(false);

  // Animated progress bar width
  const progressAnim = useRef(new Animated.Value(0)).current;

  const { shakeAnim, shake } = useShakeAnimation();
  const mountAnim = useAnimatedMount(0);

  const exercise = exercises[currentIdx];
  const lesson = getLessonById(lessonId as string);

  // Animate progress bar on question change
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentIdx / exercises.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentIdx]);

  useEffect(() => {
    if (exercise?.type === EXERCISE_TYPES.TRANSLATION && exercise.wordBank) {
      setWordBankAvailable([...exercise.wordBank]);
      setWordBankSelected([]);
    }
    setIsAnswered(false);
    setSpecialAnswered(false);
    setSelectedAnswer(null);
    setTextAnswer('');
  }, [currentIdx]);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      showAlert(
        'Leave Exercise?',
        'Your progress will be lost.',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => { stopAllSounds(); router.back(); } },
        ]
      );
      return true;
    });
    return () => { handler.remove(); stopAllSounds(); };
  }, []);

  const getAnswer = (): string => {
    if (exercise.type === EXERCISE_TYPES.MULTIPLE_CHOICE) return selectedAnswer || '';
    if (exercise.type === EXERCISE_TYPES.FILL_BLANK) return textAnswer.trim();
    if (exercise.type === EXERCISE_TYPES.TRANSLATION) return wordBankSelected.join(' ');
    return '';
  };

  const handleSubmit = async () => {
    const answer = getAnswer();
    if (!answer) return;

    const correct = checkAnswer(exercise, answer);
    setIsCorrect(correct);
    setIsAnswered(true);

    if (!correct) {
      shake();
      setLives(l => Math.max(0, l - 1));
      await playWrongSound();
    } else {
      setCorrectCount(c => c + 1);
      await playCorrectSound();
      if (exercise.vocabulary) {
        Speech.speak(exercise.vocabulary.word, { language: 'en-US', rate: 0.9 });
      }
    }
  };

  const handleSpecialAnswer = useCallback(async (correct: boolean) => {
    setSpecialAnswered(true);
    setSpecialCorrect(correct);
    setIsCorrect(correct);
    if (!correct) {
      shake();
      setLives(l => Math.max(0, l - 1));
      await playWrongSound();
    } else {
      setCorrectCount(c => c + 1);
      await playCorrectSound();
    }
  }, []);

  const finishSession = useCallback(async (extraCorrect?: number) => {
    const total = exercises.length;
    const finalCorrect = correctCount + (extraCorrect ?? 0);
    const accuracy = finalCorrect / total;
    const xpBase = lesson?.xpReward || 20;
    const xpGained = calculateXp(xpBase, accuracy, lives, true);
    const score = Math.round(accuracy * 100);
    const stars = score >= 100 ? 3 : score >= 75 ? 2 : score >= 50 ? 1 : 0;

    await playCompleteSound();

    if (user && score >= 50) {
      await completeLesson(user.id, lessonId as string, score, stars);
      await addXp(xpGained, 'LESSON');
    }

    router.replace({
      pathname: '/result',
      params: {
        lessonId,
        score: String(score),
        xpGained: String(xpGained),
        stars: String(stars),
        correctCount: String(finalCorrect),
        totalCount: String(total),
        timeTaken: String(Math.round((Date.now() - startTime) / 1000)),
      },
    });
  }, [correctCount, lives, exercises.length, lesson, user, lessonId]);

  const handleContinue = async () => {
    const nextIdx = currentIdx + 1;
    const isGameOver = lives === 0 && !isCorrect && !specialCorrect;

    if (isGameOver || nextIdx >= exercises.length) {
      await finishSession();
    } else {
      setCurrentIdx(nextIdx);
    }
  };

  const toggleWordBank = (word: string, fromSelected: boolean) => {
    if (isAnswered) return;
    if (fromSelected) {
      setWordBankSelected(prev => {
        const idx = prev.indexOf(word);
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
      setWordBankAvailable(prev => [...prev, word]);
    } else {
      setWordBankAvailable(prev => {
        const idx = prev.indexOf(word);
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
      setWordBankSelected(prev => [...prev, word]);
    }
  };

  if (!exercise) return null;

  const isSpecialType = [EXERCISE_TYPES.LISTENING, EXERCISE_TYPES.SPEAKING, EXERCISE_TYPES.MATCHING].includes(exercise.type as any);
  const canSubmit = isSpecialType
    ? false
    : exercise.type === EXERCISE_TYPES.MULTIPLE_CHOICE
    ? !!selectedAnswer
    : exercise.type === EXERCISE_TYPES.FILL_BLANK
    ? textAnswer.trim().length > 0
    : wordBankSelected.length > 0;

  const showContinueButton = isSpecialType ? specialAnswered : isAnswered;
  const showSubmitButton = !isSpecialType && !isAnswered;
  const effectiveIsCorrect = isSpecialType ? specialCorrect : isCorrect;

  const typeLabel = {
    [EXERCISE_TYPES.MULTIPLE_CHOICE]: '🎯 Choose the correct answer',
    [EXERCISE_TYPES.FILL_BLANK]: '✏️ Fill in the blank',
    [EXERCISE_TYPES.TRANSLATION]: '🔤 Arrange the sentence',
    [EXERCISE_TYPES.LISTENING]: '👂 Listen carefully',
    [EXERCISE_TYPES.SPEAKING]: '🎤 Say the sentence aloud',
    [EXERCISE_TYPES.MATCHING]: '🔗 Match the pairs',
  }[exercise.type] || '📝 Answer the question';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => showAlert('Leave?', 'Progress will be lost.', [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => { stopAllSounds(); router.back(); } },
        ])} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.progressWrap}>
          <ProgressBar progress={currentIdx / exercises.length} height={10} animated />
        </View>
        <View style={styles.livesWrap}>
          {[...Array(TOTAL_LIVES)].map((_, i) => (
            <Text key={i} style={[styles.heart, i >= lives && styles.heartLost]}>❤️</Text>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          style={{ opacity: mountAnim.opacity }}
        >
          {/* Type label + counter */}
          <View style={styles.typeRow}>
            <Text style={styles.typeLabel}>{typeLabel}</Text>
            <Text style={styles.counter}>{currentIdx + 1}/{exercises.length}</Text>
          </View>

          {/* Question card — only for standard types */}
          {!isSpecialType && (
            <Animated.View style={[styles.questionCard, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles.question}>{exercise.question}</Text>
              {exercise.hint && !isAnswered && (
                <Text style={styles.hint}>💡 {exercise.hint}</Text>
              )}
            </Animated.View>
          )}

          {/* Special exercise types */}
          {exercise.type === EXERCISE_TYPES.LISTENING && exercise.audioText && exercise.options && (
            <ListeningExercise
              audioText={exercise.audioText}
              question={exercise.question}
              options={exercise.options}
              correctAnswer={exercise.correctAnswer}
              onAnswer={handleSpecialAnswer}
            />
          )}

          {exercise.type === EXERCISE_TYPES.SPEAKING && exercise.targetSentence && (
            <SpeakingExercise
              targetSentence={exercise.targetSentence}
              phoneticGuide={exercise.phoneticGuide || ''}
              onAnswer={handleSpecialAnswer}
            />
          )}

          {exercise.type === EXERCISE_TYPES.MATCHING && exercise.pairs && (
            <MatchingPairsExercise
              pairs={exercise.pairs}
              onComplete={handleSpecialAnswer}
            />
          )}

          {/* Multiple Choice */}
          {exercise.type === EXERCISE_TYPES.MULTIPLE_CHOICE && exercise.options && (
            <Animated.View style={[styles.options, { transform: [{ translateX: shakeAnim }] }]}>
              {exercise.options.map(opt => {
                const isSelected = selectedAnswer === opt;
                const showResult = isAnswered;
                const isCorrectOpt = opt === exercise.correctAnswer;
                let bg = Colors.surface;
                let border = Colors.border;
                if (showResult && isSelected && isCorrect) { bg = Colors.successBg; border = Colors.primary; }
                else if (showResult && isSelected && !isCorrect) { bg = Colors.errorBg; border = Colors.error; }
                else if (showResult && isCorrectOpt) { bg = Colors.successBg; border = Colors.primary; }
                else if (isSelected) { bg = Colors.primaryBg; border = Colors.primary; }

                return (
                  <Pressable
                    key={opt}
                    onPress={() => !isAnswered && setSelectedAnswer(opt)}
                    style={({ pressed }) => [
                      styles.option,
                      { backgroundColor: bg, borderColor: border },
                      pressed && !isAnswered && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Text style={styles.optionText}>{opt}</Text>
                    {showResult && isCorrectOpt && <Text style={{ fontSize: 18 }}>✓</Text>}
                    {showResult && isSelected && !isCorrect && <Text style={{ fontSize: 18 }}>✗</Text>}
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {/* Fill in the Blank */}
          {exercise.type === EXERCISE_TYPES.FILL_BLANK && (
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                style={[styles.textInput, isAnswered && (isCorrect ? styles.inputCorrect : styles.inputWrong)]}
                value={textAnswer}
                onChangeText={t => !isAnswered && setTextAnswer(t)}
                placeholder="Type your answer..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                editable={!isAnswered}
              />
            </Animated.View>
          )}

          {/* Translation word bank */}
          {exercise.type === EXERCISE_TYPES.TRANSLATION && (
            <View style={styles.translationWrap}>
              <View style={styles.sentenceArea}>
                {wordBankSelected.length === 0 ? (
                  <Text style={styles.sentencePlaceholder}>Tap words below to build the sentence...</Text>
                ) : (
                  <View style={styles.sentenceWords}>
                    {wordBankSelected.map((word, i) => (
                      <Pressable key={`${word}-${i}`} onPress={() => !isAnswered && toggleWordBank(word, true)} style={styles.sentenceWord}>
                        <Text style={styles.sentenceWordText}>{word}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.wordBank}>
                {wordBankAvailable.map((word, i) => (
                  <Pressable key={`${word}-${i}`} onPress={() => !isAnswered && toggleWordBank(word, false)} style={styles.wordChip}>
                    <Text style={styles.wordChipText}>{word}</Text>
                  </Pressable>
                ))}
              </View>
              {isAnswered && (
                <Text style={[styles.correctSentence, isCorrect ? styles.correctText : styles.wrongText]}>
                  {isCorrect ? '✓ Correct!' : `✗ Correct: "${exercise.correctAnswer}"`}
                </Text>
              )}
            </View>
          )}

          {/* Feedback for standard types */}
          {isAnswered && exercise.type !== EXERCISE_TYPES.TRANSLATION && !isSpecialType && (
            <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Text style={styles.feedbackIcon}>{isCorrect ? '✓' : '✗'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, isCorrect ? styles.correctText : styles.wrongText]}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Text>
                {!isCorrect && (
                  <Text style={styles.feedbackAnswer}>Answer: {exercise.correctAnswer}</Text>
                )}
              </View>
            </View>
          )}
        </Animated.ScrollView>

        {/* Submit / Continue */}
        <View style={styles.footer}>
          {showContinueButton && (
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.submitBtn,
                effectiveIsCorrect ? styles.submitCorrect : styles.submitWrong,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.submitText}>Continue →</Text>
            </Pressable>
          )}
          {showSubmitButton && (
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                !canSubmit && styles.submitDisabled,
                pressed && canSubmit && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.submitText}>Check Answer</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.md },
  closeBtn: { padding: Spacing.sm, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  closeText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  progressWrap: { flex: 1 },
  livesWrap: { flexDirection: 'row', gap: 4 },
  heart: { fontSize: 18 },
  heartLost: { opacity: 0.2 },
  scroll: { padding: Spacing.lg, paddingBottom: 20 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  typeLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  counter: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  questionCard: { backgroundColor: Colors.primaryBg, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.primaryLight },
  question: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center', lineHeight: 28 },
  hint: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, fontStyle: 'italic' },
  options: { gap: Spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 2, minHeight: 56 },
  optionText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  textInput: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, fontSize: FontSize.lg, color: Colors.textPrimary, borderWidth: 2, borderColor: Colors.border, minHeight: 60 },
  inputCorrect: { borderColor: Colors.primary, backgroundColor: Colors.successBg },
  inputWrong: { borderColor: Colors.error, backgroundColor: Colors.errorBg },
  translationWrap: { gap: Spacing.md },
  sentenceArea: { minHeight: 80, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', padding: Spacing.md, justifyContent: 'center' },
  sentencePlaceholder: { color: Colors.textMuted, textAlign: 'center', fontSize: FontSize.sm },
  sentenceWords: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  sentenceWord: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  sentenceWordText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  wordChip: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border },
  wordChipText: { color: Colors.textPrimary, fontWeight: FontWeight.semibold, fontSize: FontSize.base },
  correctSentence: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center' },
  correctText: { color: Colors.primary },
  wrongText: { color: Colors.error },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.md },
  feedbackCorrect: { backgroundColor: Colors.successBg },
  feedbackWrong: { backgroundColor: Colors.errorBg },
  feedbackIcon: { fontSize: 24 },
  feedbackTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  feedbackAnswer: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  footer: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', ...Shadow.md },
  submitDisabled: { backgroundColor: Colors.border, elevation: 0, shadowOpacity: 0 },
  submitCorrect: { backgroundColor: Colors.primary },
  submitWrong: { backgroundColor: Colors.error },
  submitText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
