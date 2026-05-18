import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../constants/theme';

interface ListeningExerciseProps {
  audioText: string;
  question: string;
  options: string[];
  correctAnswer: string;
  onAnswer: (isCorrect: boolean) => void;
}

const REPLAY_COOLDOWN = 3;

export function ListeningExercise({
  audioText,
  question,
  options,
  correctAnswer,
  onAnswer,
}: ListeningExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const playAudio = useCallback((slow: boolean) => {
    if (cooldown > 0 || isPlaying) return;
    setIsPlaying(true);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ).start();

    Speech.speak(audioText, {
      language: 'en-US',
      rate: slow ? 0.5 : 0.9,
      onDone: () => {
        setIsPlaying(false);
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
        if (!isAnswered) {
          setCooldown(REPLAY_COOLDOWN);
          cooldownRef.current = setInterval(() => {
            setCooldown(c => {
              if (c <= 1) {
                if (cooldownRef.current) clearInterval(cooldownRef.current);
                return 0;
              }
              return c - 1;
            });
          }, 1000);
        }
      },
      onError: () => {
        setIsPlaying(false);
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
      },
    });
  }, [audioText, cooldown, isPlaying, isAnswered, pulseAnim]);

  useEffect(() => {
    const timer = setTimeout(() => playAudio(false), 600);
    return () => {
      clearTimeout(timer);
      Speech.stop();
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const handleSelect = (opt: string) => {
    if (isAnswered) return;
    setSelected(opt);
    setIsAnswered(true);
    const correct = opt.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    onAnswer(correct);
  };

  const handleReplay = () => {
    if (cooldown > 0 || isPlaying || isAnswered) return;
    playAudio(isSlowMode);
  };

  const toggleSlow = () => {
    if (isAnswered) return;
    setIsSlowMode(s => !s);
  };

  return (
    <View style={styles.container}>
      {/* Speaker button */}
      <View style={styles.speakerSection}>
        <Animated.View style={[styles.speakerRing, { transform: [{ scale: pulseAnim }] }]}>
          <Pressable
            onPress={handleReplay}
            disabled={cooldown > 0 || isPlaying || isAnswered}
            style={[styles.speakerBtn, (cooldown > 0 || isAnswered) && styles.speakerDisabled]}
          >
            <Text style={styles.speakerIcon}>{isPlaying ? '🔊' : '🔉'}</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.controls}>
          {cooldown > 0 && !isAnswered && (
            <Text style={styles.cooldownText}>Replay in {cooldown}s</Text>
          )}
          {!isAnswered && (
            <Pressable
              onPress={toggleSlow}
              style={[styles.slowBtn, isSlowMode && styles.slowBtnActive]}
            >
              <Text style={styles.slowBtnText}>🐢 {isSlowMode ? 'Slow ON' : 'Slow'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Question */}
      <Text style={styles.question}>{question}</Text>

      {/* Options */}
      <View style={styles.options}>
        {options.map(opt => {
          const isSelected = selected === opt;
          const isCorrectOpt = opt.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          let bg = Colors.surface;
          let border = Colors.border;

          if (isAnswered && isSelected && isCorrectOpt) { bg = Colors.successBg; border = Colors.primary; }
          else if (isAnswered && isSelected && !isCorrectOpt) { bg = Colors.errorBg; border = Colors.error; }
          else if (isAnswered && isCorrectOpt) { bg = Colors.successBg; border = Colors.primary; }
          else if (isSelected) { bg = Colors.primaryBg; border = Colors.primary; }

          return (
            <Pressable
              key={opt}
              onPress={() => handleSelect(opt)}
              disabled={isAnswered}
              style={[styles.option, { backgroundColor: bg, borderColor: border }]}
            >
              <Text style={styles.optionText}>{opt}</Text>
              {isAnswered && isCorrectOpt && <Text style={{ fontSize: 18 }}>✓</Text>}
              {isAnswered && isSelected && !isCorrectOpt && <Text style={{ fontSize: 18 }}>✗</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  speakerSection: { alignItems: 'center', gap: Spacing.md },
  speakerRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.accentBlueBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.accentBlue,
  },
  speakerBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  speakerDisabled: { opacity: 0.5 },
  speakerIcon: { fontSize: 36 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cooldownText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  slowBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  slowBtnActive: { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlueBg },
  slowBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  question: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary,
    textAlign: 'center',
  },
  options: { gap: Spacing.sm },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 2, minHeight: 56,
  },
  optionText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
});
