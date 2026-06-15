import type { QuizQuestion, QuizResult } from '@/types';
import { getRandomQuestion } from '@/data/quiz-questions';

const BASE_SCORE = 10;
const STREAK_BONUS = [0, 0, 2, 4, 6, 8, 10];

export const calculateScore = (streak: number): number => {
  const bonusIndex = Math.min(streak, STREAK_BONUS.length - 1);
  return BASE_SCORE + STREAK_BONUS[bonusIndex];
};

export const getStreakBonus = (streak: number): number => {
  const bonusIndex = Math.min(streak, STREAK_BONUS.length - 1);
  return STREAK_BONUS[bonusIndex];
};

export const fetchRandomQuestion = (country: string): QuizQuestion | null => {
  return getRandomQuestion(country);
};

export const checkAnswer = (
  question: QuizQuestion,
  selectedIndex: number,
  currentStreak: number
): QuizResult => {
  const isCorrect = selectedIndex === question.correctIndex;
  const newStreak = isCorrect ? currentStreak + 1 : 0;
  const scoreGained = isCorrect ? calculateScore(currentStreak + 1) : 0;

  return {
    isCorrect,
    scoreGained,
    streak: newStreak,
    correctAnswer: question.options[question.correctIndex],
    explanation: question.explanation,
  };
};
