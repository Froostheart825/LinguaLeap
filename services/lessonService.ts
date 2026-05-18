import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress } from './types';
import { SEED_LESSONS, SEED_VOCABULARY } from './seedData';
import { STORAGE_KEYS, LESSON_STATUS } from '../constants/config';

export function getAllLessons() {
  return SEED_LESSONS;
}

export function getLessonById(id: string) {
  return SEED_LESSONS.find(l => l.id === id) || null;
}

export function getVocabularyByLesson(lessonId: string) {
  return SEED_VOCABULARY.filter(v => v.lessonId === lessonId);
}

export function getAllVocabulary() {
  return SEED_VOCABULARY;
}

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
  const all: UserProgress[] = raw ? JSON.parse(raw) : [];
  const userProgress = all.filter(p => p.userId === userId);

  // Ensure all lessons have a progress entry
  const result: UserProgress[] = [];
  for (const lesson of SEED_LESSONS) {
    const existing = userProgress.find(p => p.lessonId === lesson.id);
    if (existing) {
      result.push(existing);
    } else {
      const status = computeStatus(lesson.id, result, lesson.requiredLessonId);
      result.push({
        userId,
        lessonId: lesson.id,
        status,
        completionCount: 0,
        bestScore: 0,
        lastCompletedAt: null,
        stars: 0,
      });
    }
  }
  return result;
}

function computeStatus(lessonId: string, existing: UserProgress[], requiredId: string | null): string {
  if (!requiredId) return LESSON_STATUS.AVAILABLE;
  const req = existing.find(p => p.lessonId === requiredId);
  if (req && req.status === LESSON_STATUS.COMPLETED) return LESSON_STATUS.AVAILABLE;
  return LESSON_STATUS.LOCKED;
}

export async function updateProgress(userId: string, progress: UserProgress): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
  const all: UserProgress[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex(p => p.userId === userId && p.lessonId === progress.lessonId);

  if (idx >= 0) {
    all[idx] = progress;
  } else {
    all.push(progress);
  }

  // Unlock next lesson if this one is completed
  if (progress.status === LESSON_STATUS.COMPLETED) {
    const lessons = SEED_LESSONS;
    const nextLesson = lessons.find(l => l.requiredLessonId === progress.lessonId);
    if (nextLesson) {
      const nextIdx = all.findIndex(p => p.userId === userId && p.lessonId === nextLesson.id);
      const nextProgress: UserProgress = {
        userId,
        lessonId: nextLesson.id,
        status: LESSON_STATUS.AVAILABLE,
        completionCount: 0,
        bestScore: 0,
        lastCompletedAt: null,
        stars: 0,
      };
      if (nextIdx >= 0) {
        if (all[nextIdx].status === LESSON_STATUS.LOCKED) {
          all[nextIdx] = nextProgress;
        }
      } else {
        all.push(nextProgress);
      }
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(all));
}

export async function completeLesson(
  userId: string,
  lessonId: string,
  score: number,
  stars: number,
): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
  const all: UserProgress[] = raw ? JSON.parse(raw) : [];
  const existing = all.find(p => p.userId === userId && p.lessonId === lessonId);
  const isFirst = !existing || existing.completionCount === 0;

  const updated: UserProgress = {
    userId,
    lessonId,
    status: LESSON_STATUS.COMPLETED,
    completionCount: (existing?.completionCount || 0) + 1,
    bestScore: Math.max(existing?.bestScore || 0, score),
    lastCompletedAt: Date.now(),
    stars: Math.max(existing?.stars || 0, stars),
  };

  await updateProgress(userId, updated);
}
