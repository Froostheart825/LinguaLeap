import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Radius } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = Colors.primary,
  backgroundColor = Colors.border,
  height = 12,
  borderRadius = Radius.full,
  animated = true,
}: ProgressBarProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clamped = Math.min(1, Math.max(0, progress));
    if (animated) {
      Animated.spring(animValue, {
        toValue: clamped,
        useNativeDriver: false,
        tension: 60,
        friction: 10,
      }).start();
    } else {
      animValue.setValue(clamped);
    }
  }, [progress, animated, animValue]);

  const widthInterpolated = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, borderRadius, backgroundColor }]}>
      <Animated.View style={[styles.fill, { width: widthInterpolated, backgroundColor: color, borderRadius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
