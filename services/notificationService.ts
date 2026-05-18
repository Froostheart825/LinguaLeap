import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  hour: 20,
  minute: 0,
};

const REMINDER_MESSAGES = [
  { title: "🔥 Don't break your streak!", body: 'Just 5 minutes of English today keeps your streak alive.' },
  { title: '📚 Your lesson is waiting', body: 'Keep the momentum going — learn something new today.' },
  { title: '⏰ Daily English reminder', body: 'A little practice every day makes a big difference.' },
  { title: '🌟 Time to earn some XP!', body: 'Open LinguaLeap and crush your daily goal.' },
  { title: '🎯 Stay on track', body: 'Your daily English practice is ready when you are.' },
];

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

export async function scheduleDailyReminder(settings: NotificationSettings): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.enabled) return;

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound: true,
        data: { screen: 'home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hour,
        minute: settings.minute,
      },
    });
  } catch {
    // Notifications not available in all environments
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export function setupNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {}
}
