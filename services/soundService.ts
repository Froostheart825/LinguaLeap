import * as Speech from 'expo-speech';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = 'sound_enabled';

export async function isSoundEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
  return val === null ? true : val === 'true';
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}

const HAPTIC = {
  correct: [0, 50],
  wrong: [0, 80, 60, 80],
  complete: [0, 100, 50, 100, 50, 200],
  streak: [0, 200],
};

export async function playCorrectSound(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  try { Vibration.vibrate(HAPTIC.correct); } catch {}
}

export async function playWrongSound(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  try { Vibration.vibrate(HAPTIC.wrong); } catch {}
}

export async function playCompleteSound(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  try { Vibration.vibrate(HAPTIC.complete); } catch {}
  Speech.speak('Excellent', { language: 'en-US', rate: 1.0, pitch: 1.2 });
}

export async function playStreakSound(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  try { Vibration.vibrate(HAPTIC.streak); } catch {}
  Speech.speak('Streak', { language: 'en-US', rate: 1.0, pitch: 1.4 });
}

export async function playLevelUpSound(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  try { Vibration.vibrate(HAPTIC.complete); } catch {}
  Speech.speak('Level up', { language: 'en-US', rate: 0.9, pitch: 1.3 });
}

export function stopAllSounds(): void {
  try {
    Speech.stop();
    Vibration.cancel();
  } catch {}
}
