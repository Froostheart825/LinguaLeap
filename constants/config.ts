export const APP_CONFIG = {
  name: 'LinguaLeap',
  version: '1.0.0',
  defaultDailyGoal: 20,
  maxLives: 3,
  questionsPerLesson: 8,
  minXp: 5,
  streakFreezeEnabled: false,
};

export const STORAGE_KEYS = {
  currentUser: 'lingua_current_user',
  users: 'lingua_users',
  progress: 'lingua_progress',
  vocabulary_review: 'lingua_vocab_review',
  onboardingDone: 'lingua_onboarding_done',
  xpHistory: 'lingua_xp_history',
};

export const EXERCISE_TYPES = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  FILL_BLANK: 'FILL_BLANK',
  TRANSLATION: 'TRANSLATION',
  LISTENING: 'LISTENING',
  SPEAKING: 'SPEAKING',
  MATCHING: 'MATCHING',
} as const;

export const DIFFICULTY = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;

export const LESSON_STATUS = {
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export const CATEGORY_ICONS: Record<string, string> = {
  GREETINGS: '👋',
  DAILY_LIFE: '🏠',
  FAMILY: '👨‍👩‍👧‍👦',
  WORK: '💼',
  TRAVEL: '✈️',
};

export const CATEGORY_LABELS: Record<string, string> = {
  GREETINGS: 'Greetings',
  DAILY_LIFE: 'Daily Life',
  FAMILY: 'Family',
  WORK: 'Work',
  TRAVEL: 'Travel',
};
