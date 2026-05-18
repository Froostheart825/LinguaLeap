import { Exercise, Vocabulary, MatchingPair } from './types';
import { getVocabularyByLesson, getAllVocabulary } from './lessonService';
import { EXERCISE_TYPES } from '../constants/config';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMultipleChoice(vocab: Vocabulary, allVocab: Vocabulary[]): Exercise {
  const isEnToVi = Math.random() > 0.5;
  const distractors = allVocab
    .filter(v => v.id !== vocab.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  if (isEnToVi) {
    const options = shuffle([vocab.meaning, ...distractors.map(d => d.meaning)]);
    return {
      id: `mc_${vocab.id}_${Date.now()}`,
      type: EXERCISE_TYPES.MULTIPLE_CHOICE,
      question: `What does "${vocab.word}" mean?`,
      correctAnswer: vocab.meaning,
      options,
      vocabulary: vocab,
    };
  } else {
    const options = shuffle([vocab.word, ...distractors.map(d => d.word)]);
    return {
      id: `mc_${vocab.id}_${Date.now()}`,
      type: EXERCISE_TYPES.MULTIPLE_CHOICE,
      question: `Which word means "${vocab.meaning}"?`,
      correctAnswer: vocab.word,
      options,
      vocabulary: vocab,
    };
  }
}

function buildFillBlank(vocab: Vocabulary): Exercise {
  const sentence = vocab.exampleSentence;
  const wordToBlank = vocab.word;
  const blanked = sentence.replace(new RegExp(wordToBlank, 'i'), '______');
  return {
    id: `fb_${vocab.id}_${Date.now()}`,
    type: EXERCISE_TYPES.FILL_BLANK,
    question: blanked,
    correctAnswer: wordToBlank.toLowerCase(),
    hint: `${vocab.phonetic} — ${vocab.meaning}`,
    vocabulary: vocab,
  };
}

function buildTranslation(vocab: Vocabulary, allVocab: Vocabulary[]): Exercise {
  const sentence = vocab.exampleTranslation;
  const words = vocab.exampleSentence.split(' ');
  const distractorWords = allVocab
    .filter(v => v.id !== vocab.id)
    .flatMap(v => v.exampleSentence.split(' '))
    .filter(w => !words.includes(w))
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  const wordBank = shuffle([...words, ...distractorWords]);
  return {
    id: `tr_${vocab.id}_${Date.now()}`,
    type: EXERCISE_TYPES.TRANSLATION,
    question: sentence,
    correctAnswer: vocab.exampleSentence,
    wordBank,
    vocabulary: vocab,
  };
}

function buildListening(vocab: Vocabulary, allVocab: Vocabulary[]): Exercise {
  const distractors = allVocab
    .filter(v => v.id !== vocab.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = shuffle([vocab.word, ...distractors.map(d => d.word)]);
  return {
    id: `li_${vocab.id}_${Date.now()}`,
    type: EXERCISE_TYPES.LISTENING,
    question: 'What word did you hear?',
    correctAnswer: vocab.word,
    audioText: vocab.word,
    options,
    vocabulary: vocab,
  };
}

function buildSpeaking(vocab: Vocabulary): Exercise {
  return {
    id: `sp_${vocab.id}_${Date.now()}`,
    type: EXERCISE_TYPES.SPEAKING,
    question: vocab.exampleSentence,
    correctAnswer: vocab.exampleSentence,
    targetSentence: vocab.exampleSentence,
    phoneticGuide: vocab.phonetic,
    vocabulary: vocab,
  };
}

function buildMatching(lessonVocab: Vocabulary[]): Exercise {
  const pairs: MatchingPair[] = shuffle(lessonVocab)
    .slice(0, 6)
    .map(v => ({ english: v.word, vietnamese: v.meaning }));
  return {
    id: `match_${Date.now()}`,
    type: EXERCISE_TYPES.MATCHING,
    question: 'Match each English word with its meaning',
    correctAnswer: 'matched',
    pairs,
  };
}

export function generateExercises(lessonId: string, count: number = 10): Exercise[] {
  const lessonVocab = getVocabularyByLesson(lessonId);
  const allVocab = getAllVocabulary();

  if (lessonVocab.length === 0) return [];

  const shuffledVocab = shuffle(lessonVocab);
  const exercises: Exercise[] = [];

  // Distribution: 3 MC, 2 FB, 2 TR, 1 Listening, 1 Speaking, 1 Matching
  const plan: Array<() => Exercise> = [
    () => buildMultipleChoice(shuffledVocab[0 % shuffledVocab.length], allVocab),
    () => buildMultipleChoice(shuffledVocab[1 % shuffledVocab.length], allVocab),
    () => buildMultipleChoice(shuffledVocab[2 % shuffledVocab.length], allVocab),
    () => buildFillBlank(shuffledVocab[3 % shuffledVocab.length]),
    () => buildFillBlank(shuffledVocab[4 % shuffledVocab.length]),
    () => buildTranslation(shuffledVocab[5 % shuffledVocab.length], allVocab),
    () => buildTranslation(shuffledVocab[6 % shuffledVocab.length], allVocab),
    () => buildListening(shuffledVocab[7 % shuffledVocab.length], allVocab),
    () => buildSpeaking(shuffledVocab[8 % shuffledVocab.length]),
    () => buildMatching(lessonVocab),
  ];

  const shuffledPlan = shuffle(plan);
  const total = Math.min(count, shuffledPlan.length);
  for (let i = 0; i < total; i++) {
    exercises.push(shuffledPlan[i]());
  }

  return exercises;
}

export function checkAnswer(exercise: Exercise, userAnswer: string): boolean {
  const correct = exercise.correctAnswer.toLowerCase().trim();
  const given = userAnswer.toLowerCase().trim();

  if (exercise.type === EXERCISE_TYPES.FILL_BLANK) {
    if (correct === given) return true;
    return levenshtein(correct, given) <= 1;
  }

  if (exercise.type === EXERCISE_TYPES.MATCHING) {
    return given === 'matched';
  }

  return correct === given;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
