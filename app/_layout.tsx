import React, { useEffect } from 'react';
import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { UserProvider } from '../contexts/UserContext';
import { LessonProvider } from '../contexts/LessonContext';
import { setupNotificationHandler, getNotificationSettings, scheduleDailyReminder, requestNotificationPermission } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

function NotificationSetup() {
  const router = useRouter();

  useEffect(() => {
    setupNotificationHandler();

    // Re-schedule if settings exist
    (async () => {
      try {
        const settings = await getNotificationSettings();
        if (settings.enabled) {
          await scheduleDailyReminder(settings);
        }
        // Request permission after onboarding
        const onboardingDone = await AsyncStorage.getItem('lingua_onboarding_done');
        if (onboardingDone === 'true') {
          const granted = await requestNotificationPermission();
          if (granted) await scheduleDailyReminder(settings);
        }
      } catch {}
    })();

    // Handle notification taps → deep link to home
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'home') {
        router.replace('/(tabs)/');
      }
    });

    return () => sub.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <UserProvider>
          <LessonProvider>
            <NotificationSetup />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="login" />
              <Stack.Screen name="goal-picker" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="lesson/[id]" />
              <Stack.Screen name="exercise" />
              <Stack.Screen name="result" />
              <Stack.Screen name="flashcards" />
            </Stack>
          </LessonProvider>
        </UserProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
