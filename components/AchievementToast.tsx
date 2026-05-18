import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../constants/theme';
import { Achievement } from '../services/achievementService';

interface AchievementToastProps {
  achievement: Achievement | null;
}

const { width } = Dimensions.get('window');

export function AchievementToast({ achievement }: AchievementToastProps) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!achievement) return;

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 3000);

    return () => {
      clearTimeout(hideTimer);
      translateY.setValue(-120);
      opacity.setValue(0);
    };
  }, [achievement?.id]);

  if (!achievement) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { transform: [{ translateY }], opacity }]}
    >
      <View style={styles.toast}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{achievement.icon}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>Achievement Unlocked!</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.desc} numberOfLines={1}>{achievement.description}</Text>
        </View>
        <Text style={styles.badge}>🏆</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEA',
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.gold,
    padding: Spacing.md,
    gap: Spacing.md,
    width: '100%',
    ...Shadow.lg,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.secondaryBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gold,
  },
  icon: { fontSize: 26 },
  textWrap: { flex: 1, gap: 2 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  desc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  badge: { fontSize: 24 },
});
