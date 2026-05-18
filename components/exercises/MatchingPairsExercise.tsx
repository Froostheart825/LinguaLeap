import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Animated,
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import * as Speech from 'expo-speech';

export interface MatchingPair {
  english: string;
  vietnamese: string;
}

interface MatchingPairsExerciseProps {
  pairs: MatchingPair[];
  onComplete: (allCorrect: boolean) => void;
}

type CardState = 'default' | 'selected' | 'matched' | 'wrong';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MatchingPairsExercise({ pairs, onComplete }: MatchingPairsExerciseProps) {
  const maxPairs = pairs.slice(0, 6);
  const [leftItems] = useState(() => shuffle(maxPairs.map((p, i) => ({ id: i, text: p.english, side: 'left' as const }))));
  const [rightItems] = useState(() => shuffle(maxPairs.map((p, i) => ({ id: i, text: p.vietnamese, side: 'right' as const }))));

  const [leftStates, setLeftStates] = useState<CardState[]>(Array(maxPairs.length).fill('default'));
  const [rightStates, setRightStates] = useState<CardState[]>(Array(maxPairs.length).fill('default'));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const shakeAnims = useRef(Array.from({ length: maxPairs.length * 2 }, () => new Animated.Value(0))).current;

  const shake = (indices: number[]) => {
    indices.forEach(i => {
      Animated.sequence([
        Animated.timing(shakeAnims[i], { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[i], { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[i], { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[i], { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[i], { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    });
  };

  useEffect(() => {
    if (selectedLeft === null || selectedRight === null) return;
    if (isChecking) return;
    setIsChecking(true);

    const leftItem = leftItems[selectedLeft];
    const rightItem = rightItems[selectedRight];
    const isMatch = leftItem.id === rightItem.id;

    if (isMatch) {
      Speech.speak('Correct', { language: 'en-US', rate: 1 });
      setLeftStates(prev => {
        const next = [...prev];
        next[selectedLeft!] = 'matched';
        return next;
      });
      setRightStates(prev => {
        const next = [...prev];
        next[selectedRight!] = 'matched';
        return next;
      });

      const newCount = matchedCount + 1;
      setMatchedCount(newCount);
      setSelectedLeft(null);
      setSelectedRight(null);
      setIsChecking(false);

      if (newCount === maxPairs.length) {
        setTimeout(() => onComplete(true), 600);
      }
    } else {
      // Wrong — flash red then reset
      setLeftStates(prev => {
        const next = [...prev];
        next[selectedLeft!] = 'wrong';
        return next;
      });
      setRightStates(prev => {
        const next = [...prev];
        next[selectedRight!] = 'wrong';
        return next;
      });
      shake([selectedLeft!, selectedRight! + maxPairs.length]);

      setTimeout(() => {
        setLeftStates(prev => {
          const next = [...prev];
          next[selectedLeft!] = 'default';
          return next;
        });
        setRightStates(prev => {
          const next = [...prev];
          next[selectedRight!] = 'default';
          return next;
        });
        setSelectedLeft(null);
        setSelectedRight(null);
        setIsChecking(false);
      }, 600);
    }
  }, [selectedLeft, selectedRight]);

  const handleLeftPress = (idx: number) => {
    if (isChecking || leftStates[idx] === 'matched') return;
    if (selectedLeft === idx) {
      setSelectedLeft(null);
      setLeftStates(prev => {
        const next = [...prev];
        next[idx] = 'default';
        return next;
      });
      return;
    }
    if (selectedLeft !== null) {
      setLeftStates(prev => {
        const next = [...prev];
        next[selectedLeft] = 'default';
        next[idx] = 'selected';
        return next;
      });
    } else {
      setLeftStates(prev => {
        const next = [...prev];
        next[idx] = 'selected';
        return next;
      });
    }
    setSelectedLeft(idx);
  };

  const handleRightPress = (idx: number) => {
    if (isChecking || rightStates[idx] === 'matched') return;
    if (selectedRight === idx) {
      setSelectedRight(null);
      setRightStates(prev => {
        const next = [...prev];
        next[idx] = 'default';
        return next;
      });
      return;
    }
    if (selectedRight !== null) {
      setRightStates(prev => {
        const next = [...prev];
        next[selectedRight] = 'default';
        next[idx] = 'selected';
        return next;
      });
    } else {
      setRightStates(prev => {
        const next = [...prev];
        next[idx] = 'selected';
        return next;
      });
    }
    setSelectedRight(idx);
  };

  const getCardStyle = (s: CardState) => {
    switch (s) {
      case 'selected': return { bg: Colors.accentBlueBg, border: Colors.accentBlue };
      case 'matched':  return { bg: Colors.successBg,    border: Colors.primary };
      case 'wrong':    return { bg: Colors.errorBg,      border: Colors.error };
      default:         return { bg: Colors.surface,      border: Colors.border };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{matchedCount} / {maxPairs.length} matched</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {/* Left column */}
          <View style={styles.column}>
            {leftItems.map((item, idx) => {
              const { bg, border } = getCardStyle(leftStates[idx]);
              return (
                <Animated.View key={item.id} style={{ transform: [{ translateX: shakeAnims[idx] }] }}>
                  <Pressable
                    onPress={() => handleLeftPress(idx)}
                    disabled={leftStates[idx] === 'matched'}
                    style={[styles.card, { backgroundColor: bg, borderColor: border },
                      leftStates[idx] === 'matched' && styles.cardMatched]}
                  >
                    <Text style={[styles.cardText, leftStates[idx] === 'matched' && styles.cardTextMatched]}>
                      {item.text}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Right column */}
          <View style={styles.column}>
            {rightItems.map((item, idx) => {
              const { bg, border } = getCardStyle(rightStates[idx]);
              return (
                <Animated.View key={item.id} style={{ transform: [{ translateX: shakeAnims[idx + maxPairs.length] }] }}>
                  <Pressable
                    onPress={() => handleRightPress(idx)}
                    disabled={rightStates[idx] === 'matched'}
                    style={[styles.card, { backgroundColor: bg, borderColor: border },
                      rightStates[idx] === 'matched' && styles.cardMatched]}
                  >
                    <Text style={[styles.cardText, rightStates[idx] === 'matched' && styles.cardTextMatched]}>
                      {item.text}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  progress: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary,
    textAlign: 'center',
  },
  grid: { flexDirection: 'row', gap: Spacing.sm },
  column: { flex: 1, gap: Spacing.sm },
  card: {
    borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 2,
    minHeight: 56, alignItems: 'center', justifyContent: 'center',
  },
  cardMatched: { opacity: 0.7 },
  cardText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  cardTextMatched: { color: Colors.primary },
});
