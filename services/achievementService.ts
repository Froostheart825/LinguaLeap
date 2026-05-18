import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
  category: 'streak' | 'xp' | 'lessons' | 'vocabulary' | 'social';
}

export interface AchievementStats {
  streak: number;
  totalXp: number;
  lessonsCompleted: number;
  perfectScores: number;
  wordsLearned: number;
  flashcardsReviewed: number;
}

export const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'streak_3',     title: '3-Day Streak',    description: 'Learn 3 days in a row',           icon: '🔥', category: 'streak' },
  { id: 'streak_7',     title: 'Week Warrior',     description: 'Learn 7 days in a row',           icon: '🗓️', category: 'streak' },
  { id: 'streak_30',    title: 'Monthly Master',   description: 'Learn 30 days in a row',          icon: '🏅', category: 'streak' },
  { id: 'xp_100',       title: 'First 100 XP',     description: 'Earn your first 100 XP',          icon: '⭐', category: 'xp' },
  { id: 'xp_500',       title: 'XP Hunter',        description: 'Earn 500 XP total',               icon: '💫', category: 'xp' },
  { id: 'xp_1000',      title: 'XP Master',        description: 'Earn 1000 XP total',              icon: '🌟', category: 'xp' },
  { id: 'lesson_1',     title: 'First Steps',      description: 'Complete your first lesson',       icon: '👶', category: 'lessons' },
  { id: 'lesson_5',     title: 'Getting Started',  description: 'Complete 5 lessons',               icon: '📖', category: 'lessons' },
  { id: 'lesson_15',    title: 'Lesson Legend',    description: 'Complete all 15 lessons',          icon: '🎓', category: 'lessons' },
  { id: 'perfect_3',    title: 'Perfectionist',    description: 'Get 3 perfect scores (100%)',      icon: '💯', category: 'lessons' },
  { id: 'vocab_10',     title: 'Word Collector',   description: 'Learn 10 vocabulary words',        icon: '📝', category: 'vocabulary' },
  { id: 'vocab_50',     title: 'Vocab Builder',    description: 'Learn 50 vocabulary words',        icon: '📚', category: 'vocabulary' },
  { id: 'flashcard_10', title: 'Flashcard Fan',    description: 'Review 10 flashcards',             icon: '🃏', category: 'vocabulary' },
];

const ACHIEVEMENTS_KEY = 'user_achievements';
const PERFECT_SCORES_KEY = 'perfect_scores_count';
const FLASHCARDS_REVIEWED_KEY = 'flashcards_reviewed_count';

export async function getAchievements(): Promise<Achievement[]> {
  const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
  const unlocked: Record<string, number> = raw ? JSON.parse(raw) : {};
  return ALL_ACHIEVEMENTS.map(a => ({
    ...a,
    unlockedAt: unlocked[a.id] ?? null,
  }));
}

export async function getPerfectScoresCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(PERFECT_SCORES_KEY);
  return raw ? parseInt(raw) : 0;
}

export async function incrementPerfectScores(): Promise<void> {
  const current = await getPerfectScoresCount();
  await AsyncStorage.setItem(PERFECT_SCORES_KEY, String(current + 1));
}

export async function getFlashcardsReviewedCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(FLASHCARDS_REVIEWED_KEY);
  return raw ? parseInt(raw) : 0;
}

export async function incrementFlashcardsReviewed(count: number): Promise<void> {
  const current = await getFlashcardsReviewedCount();
  await AsyncStorage.setItem(FLASHCARDS_REVIEWED_KEY, String(current + count));
}

export async function checkAndUnlockAchievements(stats: AchievementStats): Promise<Achievement[]> {
  const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
  const unlocked: Record<string, number> = raw ? JSON.parse(raw) : {};
  const newlyUnlocked: Achievement[] = [];

  const checks: Array<[string, boolean]> = [
    ['streak_3',      stats.streak >= 3],
    ['streak_7',      stats.streak >= 7],
    ['streak_30',     stats.streak >= 30],
    ['xp_100',        stats.totalXp >= 100],
    ['xp_500',        stats.totalXp >= 500],
    ['xp_1000',       stats.totalXp >= 1000],
    ['lesson_1',      stats.lessonsCompleted >= 1],
    ['lesson_5',      stats.lessonsCompleted >= 5],
    ['lesson_15',     stats.lessonsCompleted >= 15],
    ['perfect_3',     stats.perfectScores >= 3],
    ['vocab_10',      stats.wordsLearned >= 10],
    ['vocab_50',      stats.wordsLearned >= 50],
    ['flashcard_10',  stats.flashcardsReviewed >= 10],
  ];

  for (const [id, condition] of checks) {
    if (condition && !unlocked[id]) {
      unlocked[id] = Date.now();
      const def = ALL_ACHIEVEMENTS.find(a => a.id === id);
      if (def) {
        newlyUnlocked.push({ ...def, unlockedAt: unlocked[id] });
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  }

  return newlyUnlocked;
}
