import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { UserProgress, Lesson } from '../services/types';
import * as lessonService from '../services/lessonService';

interface LessonContextType {
  lessons: Lesson[];
  progress: UserProgress[];
  isLoading: boolean;
  loadProgress: (userId: string) => Promise<void>;
  completeLesson: (userId: string, lessonId: string, score: number, stars: number) => Promise<void>;
  getLessonStatus: (lessonId: string) => string;
  getLessonProgress: (lessonId: string) => UserProgress | undefined;
}

export const LessonContext = createContext<LessonContextType | undefined>(undefined);

export function LessonProvider({ children }: { children: ReactNode }) {
  const [lessons] = useState<Lesson[]>(lessonService.getAllLessons());
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProgress = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const p = await lessonService.getUserProgress(userId);
      setProgress(p);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeLesson = useCallback(async (userId: string, lessonId: string, score: number, stars: number) => {
    await lessonService.completeLesson(userId, lessonId, score, stars);
    await loadProgress(userId);
  }, [loadProgress]);

  const getLessonStatus = useCallback((lessonId: string): string => {
    const p = progress.find(x => x.lessonId === lessonId);
    return p?.status || 'LOCKED';
  }, [progress]);

  const getLessonProgress = useCallback((lessonId: string) => {
    return progress.find(x => x.lessonId === lessonId);
  }, [progress]);

  return (
    <LessonContext.Provider value={{ lessons, progress, isLoading, loadProgress, completeLesson, getLessonStatus, getLessonProgress }}>
      {children}
    </LessonContext.Provider>
  );
}
