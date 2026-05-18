import { useContext } from 'react';
import { LessonContext } from '../contexts/LessonContext';

export function useLessons() {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error('useLessons must be used within LessonProvider');
  return ctx;
}
