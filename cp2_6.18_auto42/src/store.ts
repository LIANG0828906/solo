import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  type CardColors,
  type CardData,
  type TemplateName,
  getTemplateByName,
  HISTORY_MAX_COUNT,
  FAVORITES_MAX_COUNT,
} from '@/constants/templates';
import { generateColorSchemes } from '@/utils/colorGenerator';

interface CardStore {
  currentCard: CardData;
  history: CardData[];
  favorites: CardData[];
  isHistoryOpen: boolean;
  generatedSchemes: CardColors[];
  toast: { message: string; visible: boolean };

  updateCard: (partial: Partial<CardData>) => void;
  setTemplate: (template: TemplateName) => void;
  generateColors: () => void;
  applyColors: (colors: CardColors) => void;
  saveHistory: (thumbnail?: string) => void;
  restoreCard: (id: string) => void;
  toggleFavorite: (
    id: string
  ) => {
    success: boolean;
    action: 'favorited' | 'unfavorited' | 'limit' | 'error';
  };
  removeFromHistory: (id: string) => void;
  toggleHistoryPanel: () => void;
  showToast: (message: string) => void;
  hideToast: () => void;
}

const createDefaultCard = (): CardData => {
  const template = getTemplateByName('simple');
  return {
    id: uuidv4(),
    title: '知识卡片示例标题',
    body: '这里是卡片的正文内容，支持最多200字。行高为1.6倍，首行自动缩进2字符，让排版更加美观易读。',
    emoji: '💡',
    template: 'simple',
    colors: { ...template.defaultColors },
    isFavorite: false,
    createTime: Date.now(),
  };
};

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const useCardStore = create<CardStore>((set, get) => ({
  currentCard: createDefaultCard(),
  history: loadFromStorage<CardData[]>('card_history', []),
  favorites: loadFromStorage<CardData[]>('card_favorites', []),
  isHistoryOpen: false,
  generatedSchemes: [],
  toast: { message: '', visible: false },

  updateCard: (partial) => {
    set((state) => ({
      currentCard: { ...state.currentCard, ...partial },
    }));
  },

  setTemplate: (template) => {
    const templateConfig = getTemplateByName(template);
    set((state) => ({
      currentCard: {
        ...state.currentCard,
        template,
        colors: { ...templateConfig.defaultColors },
      },
      generatedSchemes: [],
    }));
    get().saveHistory();
  },

  generateColors: () => {
    const schemes = generateColorSchemes(get().currentCard.colors);
    set({ generatedSchemes: schemes });
  },

  applyColors: (colors) => {
    set((state) => ({
      currentCard: {
        ...state.currentCard,
        colors: { ...colors },
      },
    }));
  },

  saveHistory: (thumbnail) => {
    const { currentCard, history } = get();
    const cardCopy: CardData = {
      ...currentCard,
      id: uuidv4(),
      createTime: Date.now(),
      isFavorite: false,
      thumbnail,
    };

    const newHistory = [cardCopy, ...history].slice(0, HISTORY_MAX_COUNT);
    set({ history: newHistory });
    saveToStorage('card_history', newHistory);
  },

  restoreCard: (id) => {
    const { history, favorites } = get();
    const found = history.find((c) => c.id === id) || favorites.find((c) => c.id === id);
    if (found) {
      set({
        currentCard: { ...found, id: uuidv4(), createTime: Date.now() },
      });
    }
  },

  toggleFavorite: (id) => {
    const { history, favorites } = get();
    const allCards = [...history, ...favorites];
    const card = allCards.find((c) => c.id === id);
    if (!card) {
      return { success: false, action: 'error' as const };
    }

    const isFav = favorites.some((c) => c.id === id);

    if (isFav) {
      try {
        const newFavs = favorites.filter((c) => c.id !== id);
        const cardInHistory = history.find((c) => c.id === id);
        if (cardInHistory) {
          const newHistory = history.map((c) =>
            c.id === id ? { ...c, isFavorite: false } : c
          );
          set({ favorites: newFavs, history: newHistory });
          saveToStorage('card_favorites', newFavs);
          saveToStorage('card_history', newHistory);
        } else {
          set({ favorites: newFavs });
          saveToStorage('card_favorites', newFavs);
        }
        return { success: true, action: 'unfavorited' as const };
      } catch {
        return { success: false, action: 'error' as const };
      }
    } else {
      if (favorites.length >= FAVORITES_MAX_COUNT) {
        return { success: false, action: 'limit' as const };
      }
      try {
        const favCard = { ...card, isFavorite: true };
        const newFavs = [favCard, ...favorites];
        const newHistory = history.map((c) =>
          c.id === id ? { ...c, isFavorite: true } : c
        );
        set({ favorites: newFavs, history: newHistory });
        saveToStorage('card_favorites', newFavs);
        saveToStorage('card_history', newHistory);
        return { success: true, action: 'favorited' as const };
      } catch {
        return { success: false, action: 'error' as const };
      }
    }
  },

  removeFromHistory: (id) => {
    const newHistory = get().history.filter((c) => c.id !== id);
    set({ history: newHistory });
    saveToStorage('card_history', newHistory);
  },

  toggleHistoryPanel: () => {
    set((state) => ({ isHistoryOpen: !state.isHistoryOpen }));
  },

  showToast: (message) => {
    set({ toast: { message, visible: true } });
    setTimeout(() => {
      get().hideToast();
    }, 1500);
  },

  hideToast: () => {
    set({ toast: { message: '', visible: false } });
  },
}));
