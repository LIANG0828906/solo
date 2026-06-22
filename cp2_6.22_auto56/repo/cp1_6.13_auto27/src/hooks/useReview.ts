import { useState, useCallback, useMemo } from 'react';
import type { Card, Deck } from '../types';

const getCardsForReview = (deck: Deck): Card[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deck.cards.filter(card => {
    const reviewDate = new Date(card.nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate <= today;
  });
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getIntervalDays = (correctCount: number): number => {
  const intervals = [1, 3, 7, 14, 30, 60, 90];
  return intervals[Math.min(correctCount, intervals.length - 1)];
};

export function useReview(deck: Deck, onUpdateReview: (cardId: string, isCorrect: boolean) => void) {
  const [reviewQueue, setReviewQueue] = useState<Card[]>(() =>
    shuffleArray(getCardsForReview(deck))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; days: number } | null>(null);

  const currentCard = useMemo(() => reviewQueue[currentIndex] || null, [reviewQueue, currentIndex]);

  const totalCards = reviewQueue.length;
  const completedCards = currentIndex;
  const progress = totalCards > 0 ? (completedCards / totalCards) * 100 : 0;

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleFeedback = useCallback((isCorrect: boolean) => {
    if (!currentCard) return;

    const nextCorrectCount = isCorrect
      ? Math.min(currentCard.correctCount + 1, 6)
      : 0;
    const days = getIntervalDays(nextCorrectCount);

    setLastResult({ isCorrect, days });
    onUpdateReview(currentCard.id, isCorrect);

    setTimeout(() => {
      setLastResult(null);
    }, 3000);

    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  }, [currentCard, onUpdateReview]);

  const resetReview = useCallback(() => {
    setReviewQueue(shuffleArray(getCardsForReview(deck)));
    setCurrentIndex(0);
    setIsFlipped(false);
    setLastResult(null);
  }, [deck]);

  const isComplete = currentIndex >= totalCards;

  return {
    currentCard,
    isFlipped,
    flipCard,
    handleFeedback,
    progress,
    completedCards,
    totalCards,
    isComplete,
    resetReview,
    lastResult,
  };
}
