import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { Colors, FontSize, FontWeight } from '../constants/theme';
import { STORAGE_KEYS } from '../constants/config';

export default function SplashScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      const onboardingDone = await AsyncStorage.getItem(STORAGE_KEYS.onboardingDone);
      const userId = await AsyncStorage.getItem(STORAGE_KEYS.currentUser);
      if (!onboardingDone) {
        router.replace('/onboarding');
      } else if (userId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <Text style={styles.title}>LinguaLeap</Text>
        <Text style={styles.subtitle}>Learn English Every Day</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', gap: 12 },
  logo: { width: 120, height: 120, borderRadius: 30 },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.medium },
});
