import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SM2Card {
  vocabularyId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: number;
  lastQuality: number;
}

export type ReviewQuality = 0 | 1 | 2 | 3;
// 0 = Again (complete blackout)
// 1 = Hard (wrong but remembered after seeing)
// 2 = Good (correct with effort)
// 3 = Easy (perfect recall)

const SM2_STORAGE_KEY = 'sm2_cards';

export function calculateNextReview(card: SM2Card, quality: ReviewQuality): SM2Card {
  let { easeFactor, interval, repetitions } = card;

  if (quality < 2) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)),
  );

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastQuality: quality,
  };
}

export function isDueForReview(card: SM2Card): boolean {
  return Date.now() >= card.nextReviewDate;
}

export function getDueCards(cards: SM2Card[]): SM2Card[] {
  return cards.filter(isDueForReview).sort((a, b) => a.nextReviewDate - b.nextReviewDate);
}

export async function getSM2Cards(): Promise<SM2Card[]> {
  const raw = await AsyncStorage.getItem(SM2_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSM2Card(card: SM2Card): Promise<void> {
  const cards = await getSM2Cards();
  const idx = cards.findIndex(c => c.vocabularyId === card.vocabularyId);
  if (idx >= 0) cards[idx] = card;
  else cards.push(card);
  await AsyncStorage.setItem(SM2_STORAGE_KEY, JSON.stringify(cards));
}

export async function initSM2CardIfNeeded(vocabularyId: string): Promise<SM2Card> {
  const cards = await getSM2Cards();
  const existing = cards.find(c => c.vocabularyId === vocabularyId);
  if (existing) return existing;
  const newCard: SM2Card = {
    vocabularyId,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: Date.now(),
    lastQuality: 2,
  };
  await saveSM2Card(newCard);
  return newCard;
}

export function formatNextReview(card: SM2Card): string {
  const diff = card.nextReviewDate - Date.now();
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Due now';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}
