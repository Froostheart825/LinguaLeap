import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated,
} from 'react-native';
import * as Speech from 'expo-speech';
import * as ExpoAV from 'expo-av';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

interface SpeakingExerciseProps {
  targetSentence: string;
  phoneticGuide: string;
  onAnswer: (isCorrect: boolean) => void;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'done';
type ScoreRating = 'PERFECT' | 'GOOD' | 'TRY_AGAIN';

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function similarityScore(spoken: string, target: string): number {
  const s = spoken.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (!s || !t) return 0;
  const distance = levenshteinDistance(s, t);
  const maxLen = Math.max(s.length, t.length);
  return maxLen === 0 ? 100 : Math.round((1 - distance / maxLen) * 100);
}

async function mockSpeechToText(targetSentence: string): Promise<string> {
  await new Promise<void>(r => setTimeout(r, 1500));
  const words = targetSentence.split(' ');
  if (Math.random() < 0.3 && words.length > 1) {
    const dropIdx = Math.floor(Math.random() * words.length);
    return words.filter((_, i) => i !== dropIdx).join(' ');
  }
  return targetSentence;
}

export function SpeakingExercise({ targetSentence, phoneticGuide, onAnswer }: SpeakingExerciseProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [score, setScore] = useState<number>(0);
  const [rating, setRating] = useState<ScoreRating | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recordingRef = useRef<ExpoAV.Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  };

  const handleListen = () => {
    Speech.speak(targetSentence, { language: 'en-US', rate: 0.85 });
  };

  const handleMicPress = async () => {
    if (state === 'recording') {
      await stopRecording();
    } else if (state === 'idle') {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const { granted } = await ExpoAV.Audio.requestPermissionsAsync();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      await ExpoAV.Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await ExpoAV.Audio.Recording.createAsync(
        ExpoAV.Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setState('recording');
      startPulse();

      autoStopTimer.current = setTimeout(() => {
        stopRecording();
      }, 5000);
    } catch {
      setState('idle');
    }
  };

  const stopRecording = async () => {
    if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
    stopPulse();
    setState('processing');

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      const spoken = await mockSpeechToText(targetSentence);
      const similarity = similarityScore(spoken, targetSentence);
      setScore(similarity);

      let r: ScoreRating;
      if (similarity >= 85) r = 'PERFECT';
      else if (similarity >= 60) r = 'GOOD';
      else r = 'TRY_AGAIN';

      setRating(r);
      setState('done');
      onAnswer(similarity >= 60);
    } catch {
      setState('idle');
    }
  };

  const ratingConfig = {
    PERFECT:   { emoji: '🟢', label: 'PERFECT!',    color: Colors.primary },
    GOOD:      { emoji: '🟡', label: 'GOOD',         color: Colors.secondary },
    TRY_AGAIN: { emoji: '🔴', label: 'TRY AGAIN',    color: Colors.error },
  };

  if (permissionDenied) {
    return (
      <View style={styles.container}>
        <Text style={styles.targetSentence}>{targetSentence}</Text>
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>🎤</Text>
          <Text style={styles.errorText}>Microphone permission denied. Please enable it in device settings to use speaking exercises.</Text>
        </View>
        <Pressable onPress={() => onAnswer(false)} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>Skip this exercise</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Demo notice */}
      <View style={styles.demoNotice}>
        <Text style={styles.demoText}>🎤 Speech recognition is in demo mode</Text>
      </View>

      {/* Target sentence */}
      <View style={styles.sentenceCard}>
        <Text style={styles.sentenceLabel}>Say this sentence:</Text>
        <Text style={styles.targetSentence}>{targetSentence}</Text>
        <Text style={styles.phonetic}>{phoneticGuide}</Text>
      </View>

      {/* Listen button */}
      <Pressable onPress={handleListen} style={styles.listenBtn}>
        <Text style={styles.listenBtnText}>🔊 Listen to example</Text>
      </Pressable>

      {/* Mic button */}
      <View style={styles.micSection}>
        <Animated.View style={[
          styles.micRing,
          state === 'recording' && styles.micRingActive,
          { transform: [{ scale: pulseAnim }] },
        ]}>
          <Pressable
            onPress={handleMicPress}
            disabled={state === 'processing' || state === 'done'}
            style={[styles.micBtn, state === 'recording' && styles.micBtnRecording]}
          >
            <Text style={styles.micIcon}>
              {state === 'recording' ? '⏹' : state === 'processing' ? '⏳' : '🎤'}
            </Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.micHint}>
          {state === 'idle' ? 'Tap to start speaking' :
           state === 'recording' ? 'Recording... tap to stop (auto-stops in 5s)' :
           state === 'processing' ? 'Processing...' :
           'Recording complete'}
        </Text>
      </View>

      {/* Result */}
      {rating && state === 'done' && (
        <View style={[styles.resultCard, { borderColor: ratingConfig[rating].color }]}>
          <Text style={styles.resultEmoji}>{ratingConfig[rating].emoji}</Text>
          <Text style={[styles.resultLabel, { color: ratingConfig[rating].color }]}>
            {ratingConfig[rating].label}
          </Text>
          <Text style={styles.resultScore}>{score}% match</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  demoNotice: {
    backgroundColor: Colors.secondaryBg, borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center',
  },
  demoText: { fontSize: FontSize.xs, color: Colors.secondaryDark, fontWeight: FontWeight.semibold },
  sentenceCard: {
    backgroundColor: Colors.accentPurpleBg, borderRadius: Radius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.accentPurple,
  },
  sentenceLabel: { fontSize: FontSize.sm, color: Colors.accentPurple, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  targetSentence: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center', lineHeight: 28 },
  phonetic: { fontSize: FontSize.base, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  listenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    paddingVertical: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border,
  },
  listenBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  micSection: { alignItems: 'center', gap: Spacing.md },
  micRing: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.accentPurpleBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.accentPurple,
  },
  micRingActive: { borderColor: Colors.error, backgroundColor: Colors.errorBg },
  micBtn: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.accentPurple,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnRecording: { backgroundColor: Colors.error },
  micIcon: { fontSize: 40 },
  micHint: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', fontWeight: FontWeight.semibold },
  resultCard: {
    alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 2, backgroundColor: Colors.surface,
  },
  resultEmoji: { fontSize: 36 },
  resultLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  resultScore: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  errorBox: { backgroundColor: Colors.errorBg, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  errorIcon: { fontSize: 36 },
  errorText: { fontSize: FontSize.sm, color: Colors.error, textAlign: 'center', lineHeight: 20 },
  skipBtn: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  skipBtnText: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
});
