import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, XpHistoryEntry } from './types';
import { STORAGE_KEYS } from '../constants/config';

const DEFAULT_USER: Omit<User, 'id' | 'username' | 'email' | 'createdAt'> = {
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  dailyGoalXp: 20,
  level: 1,
  todayXp: 0,
  lessonsCompleted: 0,
  wordsLearned: 0,
};

function calcLevel(totalXp: number): number {
  if (totalXp < 100) return 1;
  if (totalXp < 300) return 2;
  if (totalXp < 600) return 3;
  if (totalXp < 1000) return 4;
  if (totalXp < 1500) return 5;
  if (totalXp < 2100) return 6;
  if (totalXp < 2800) return 7;
  if (totalXp < 3600) return 8;
  if (totalXp < 4500) return 9;
  return 10;
}

export async function registerUser(username: string, email: string): Promise<User> {
  const users = await getAllUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) throw new Error('Email already registered');

  const newUser: User = {
    id: `user_${Date.now()}`,
    username,
    email,
    createdAt: Date.now(),
    ...DEFAULT_USER,
  };
  users.push(newUser);
  await AsyncStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  await AsyncStorage.setItem(STORAGE_KEYS.currentUser, newUser.id);
  return newUser;
}

export async function loginUser(email: string): Promise<User> {
  const users = await getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('No account found with this email');
  await AsyncStorage.setItem(STORAGE_KEYS.currentUser, user.id);
  return user;
}

export async function logoutUser(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.currentUser);
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = await AsyncStorage.getItem(STORAGE_KEYS.currentUser);
  if (!userId) return null;
  const users = await getAllUsers();
  return users.find(u => u.id === userId) || null;
}

export async function getAllUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.users);
  return raw ? JSON.parse(raw) : [];
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const users = await getAllUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');
  const newTotalXp = updates.totalXp ?? users[idx].totalXp;
  users[idx] = { ...users[idx], ...updates, level: calcLevel(newTotalXp) };
  await AsyncStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  return users[idx];
}

export async function addXp(userId: string, amount: number, source: string): Promise<User> {
  const users = await getAllUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  const today = new Date().toISOString().split('T')[0];
  const user = users[idx];
  const isSameDay = user.lastActiveDate === today;

  const newTotalXp = user.totalXp + amount;
  const newTodayXp = isSameDay ? user.todayXp + amount : amount;

  // Accumulate weekly XP (after possible reset)
  await checkAndResetWeeklyXp();
  await addWeeklyXp(amount);

  // Streak logic
  let newStreak = user.currentStreak;
  let newLongest = user.longestStreak;

  if (!isSameDay) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (user.lastActiveDate === yesterdayStr) {
      newStreak = user.currentStreak + 1;
    } else if (user.lastActiveDate !== today) {
      newStreak = 1;
    }
    newLongest = Math.max(newStreak, user.longestStreak);
  }

  users[idx] = {
    ...user,
    totalXp: newTotalXp,
    todayXp: newTodayXp,
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
    level: calcLevel(newTotalXp),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));

  // Save XP history
  const historyRaw = await AsyncStorage.getItem(STORAGE_KEYS.xpHistory);
  const history: XpHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
  history.push({ id: `xp_${Date.now()}`, userId, xpGained: amount, source, earnedAt: Date.now() });
  await AsyncStorage.setItem(STORAGE_KEYS.xpHistory, JSON.stringify(history));

  return users[idx];
}

export async function updateDailyGoal(userId: string, goal: number): Promise<User> {
  return updateUser(userId, { dailyGoalXp: goal });
}

export async function getXpHistory(userId: string): Promise<XpHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.xpHistory);
  const all: XpHistoryEntry[] = raw ? JSON.parse(raw) : [];
  return all.filter(h => h.userId === userId);
}

export function calculateXp(baseXp: number, accuracy: number, livesRemaining: number, isFirst: boolean): number {
  let xp = Math.floor(baseXp * accuracy);
  xp += livesRemaining * 5;
  if (isFirst) xp = Math.floor(xp * 1.5);
  return Math.max(5, xp);
}

// ── Streak Freeze ──────────────────────────────────────────────────────────
const STREAK_FREEZE_KEY = 'streak_freeze_count';

export async function getStreakFreezeCount(): Promise<number> {
  const val = await AsyncStorage.getItem(STREAK_FREEZE_KEY);
  return val ? parseInt(val) : 0;
}

export async function addStreakFreeze(count: number = 1): Promise<void> {
  const current = await getStreakFreezeCount();
  await AsyncStorage.setItem(STREAK_FREEZE_KEY, String(current + count));
}

export async function useStreakFreeze(): Promise<boolean> {
  const current = await getStreakFreezeCount();
  if (current <= 0) return false;
  await AsyncStorage.setItem(STREAK_FREEZE_KEY, String(current - 1));
  return true;
}

// ── Weekly XP ────────────────────────────────────────────────────────────
const WEEKLY_XP_KEY = 'weekly_xp';
const LAST_RESET_WEEK_KEY = 'last_reset_week';

/** Returns ISO week string like "2025-W21" */
function getISOWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

export async function getWeeklyXp(): Promise<number> {
  const raw = await AsyncStorage.getItem(WEEKLY_XP_KEY);
  return raw ? parseInt(raw) : 0;
}

export async function checkAndResetWeeklyXp(): Promise<{ weeklyXp: number; wasReset: boolean }> {
  const currentWeek = getISOWeekKey();
  const lastReset = await AsyncStorage.getItem(LAST_RESET_WEEK_KEY);
  const weeklyXp = await getWeeklyXp();

  if (lastReset !== currentWeek) {
    await AsyncStorage.setItem(WEEKLY_XP_KEY, '0');
    await AsyncStorage.setItem(LAST_RESET_WEEK_KEY, currentWeek);
    return { weeklyXp: 0, wasReset: true };
  }
  return { weeklyXp, wasReset: false };
}

export async function addWeeklyXp(amount: number): Promise<void> {
  const current = await getWeeklyXp();
  await AsyncStorage.setItem(WEEKLY_XP_KEY, String(current + amount));
}

/** Returns ms until next Monday 00:00 UTC */
export function getMsUntilNextReset(): number {
  const now = new Date();
  const nextMonday = new Date(now);
  const dayOfWeek = now.getUTCDay(); // 0=Sun,1=Mon,…,6=Sat
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);
  return nextMonday.getTime() - now.getTime();
}

export async function checkAndUpdateStreak(user: User): Promise<User> {
  const today = new Date().toISOString().split('T')[0];
  const lastActive = user.lastActiveDate;

  if (!lastActive || lastActive === today) return user;

  const daysDiff = Math.floor(
    (new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 1) return user; // consecutive — streak maintained when lesson done

  const freezeCount = await getStreakFreezeCount();
  if (freezeCount > 0 && daysDiff <= 2) {
    await useStreakFreeze();
    return updateUser(user.id, { lastActiveDate: today });
  }

  return updateUser(user.id, { currentStreak: 0, lastActiveDate: today });
}
