import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import type { CardData, StudyStats, Rating } from "./spacedRepetition";
import {
  calculateNextReview,
  getDueCards,
  getMasteryPercentage,
} from "./spacedRepetition";

interface FlashcardStore {
  cards: CardData[];
  stats: StudyStats;
  initialized: boolean;

  init: () => void;
  addCard: (front: string, back: string, category: string, tags: string[]) => void;
  updateCard: (id: string, updates: Partial<Pick<CardData, "front" | "back" | "category" | "tags">>) => void;
  deleteCard: (id: string) => void;
  reviewCard: (id: string, rating: Rating) => void;
  getDueCards: () => CardData[];
  getMasteryPercentage: () => number;
  getCardsForDate: (date: Date) => CardData[];
  getCategories: () => string[];
}

const STORAGE_KEY_CARDS = "flashcards_cards";
const STORAGE_KEY_STATS = "flashcards_stats";

const defaultStats: StudyStats = {
  streakDays: 0,
  lastStudyDate: "",
  totalReviewed: 0,
  totalMastered: 0,
};

function loadCards(): CardData[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CARDS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function loadStats(): StudyStats {
  try {
    const data = localStorage.getItem(STORAGE_KEY_STATS);
    return data ? JSON.parse(data) : defaultStats;
  } catch {
    return defaultStats;
  }
}

function saveCards(cards: CardData[]) {
  localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
}

function saveStats(stats: StudyStats) {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
}

function updateStreak(stats: StudyStats): StudyStats {
  const today = format(new Date(), "yyyy-MM-dd");
  if (stats.lastStudyDate === today) {
    return stats;
  }
  const yesterday = format(
    new Date(Date.now() - 86400000),
    "yyyy-MM-dd"
  );
  const streakDays = stats.lastStudyDate === yesterday
    ? stats.streakDays + 1
    : 1;
  return {
    ...stats,
    streakDays,
    lastStudyDate: today,
  };
}

export const useFlashcardStore = create<FlashcardStore>((set, get) => ({
  cards: [],
  stats: defaultStats,
  initialized: false,

  init: () => {
    if (get().initialized) return;
    const cards = loadCards();
    const stats = loadStats();
    set({ cards, stats, initialized: true });
  },

  addCard: (front, back, category, tags) => {
    const now = new Date().toISOString();
    const newCard: CardData = {
      id: uuidv4(),
      front,
      back,
      category,
      tags,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: now,
      createdAt: now,
      updatedAt: now,
    };
    const cards = [...get().cards, newCard];
    saveCards(cards);
    set({ cards });
  },

  updateCard: (id, updates) => {
    const cards = get().cards.map((card) =>
      card.id === id
        ? { ...card, ...updates, updatedAt: new Date().toISOString() }
        : card
    );
    saveCards(cards);
    set({ cards });
  },

  deleteCard: (id) => {
    const cards = get().cards.filter((card) => card.id !== id);
    saveCards(cards);
    set({ cards });
  },

  reviewCard: (id, rating) => {
    const cards = get().cards;
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    const updatedCard = calculateNextReview(card, rating);
    const newCards = cards.map((c) => (c.id === id ? updatedCard : c));

    let stats = updateStreak(get().stats);
    stats = {
      ...stats,
      totalReviewed: stats.totalReviewed + 1,
      totalMastered: getMasteryPercentage(newCards) * newCards.length / 100,
    };

    saveCards(newCards);
    saveStats(stats);
    set({ cards: newCards, stats });
  },

  getDueCards: () => {
    return getDueCards(get().cards);
  },

  getMasteryPercentage: () => {
    return getMasteryPercentage(get().cards);
  },

  getCardsForDate: (date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return get().cards.filter((card) => {
      const reviewDate = new Date(card.nextReview);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate.getTime() === targetDate.getTime();
    });
  },

  getCategories: () => {
    const categories = new Set(get().cards.map((c) => c.category).filter(Boolean));
    return Array.from(categories).sort();
  },
}));
