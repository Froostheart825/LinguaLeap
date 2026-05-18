export interface User {
  id: string;
  username: string;
  email: string;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  dailyGoalXp: number;
  level: number;
  todayXp: number;
  lessonsCompleted: number;
  wordsLearned: number;
  createdAt: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  xpReward: number;
  orderIndex: number;
  requiredLessonId: string | null;
  totalWords: number;
}

export interface Vocabulary {
  id: string;
  lessonId: string;
  word: string;
  phonetic: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  status: string;
  completionCount: number;
  bestScore: number;
  lastCompletedAt: number | null;
  stars: number;
}

export interface MatchingPair {
  english: string;
  vietnamese: string;
}

export interface Exercise {
  id: string;
  type: string;
  question: string;
  correctAnswer: string;
  options?: string[];
  wordBank?: string[];
  hint?: string;
  vocabulary?: Vocabulary;
  audioText?: string;
  targetSentence?: string;
  phoneticGuide?: string;
  pairs?: MatchingPair[];
}

export interface VocabularyReview {
  vocabularyId: string;
  userId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: number;
}

export interface XpHistoryEntry {
  id: string;
  userId: string;
  xpGained: number;
  source: string;
  earnedAt: number;
}

export interface SessionResult {
  lessonId: string;
  score: number;
  accuracy: number;
  xpGained: number;
  stars: number;
  timeTaken: number;
  correctCount: number;
  totalCount: number;
}
