import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  BarrageItem,
  LanguageCode,
  SpeedLevel,
  Statistics,
  UserSettings
} from '../types';
import {
  BARRAGE_COLORS,
  LANGUAGE_OPTIONS,
  MAX_BARRAGE_COUNT,
  SPEED_DURATION
} from '../types';
import { translatorEngine } from '../modules/translator/TranslatorEngine';
import { languageDetector } from '../modules/translator/LanguageDetector';

interface BarrageState {
  barrages: BarrageItem[];
  settings: UserSettings;
  statistics: Statistics;
  occupiedTracks: Map<number, number>;
  trackCount: number;
  isTransitioning: boolean;

  addBarrage: (text: string, sourceLang?: LanguageCode) => Promise<void>;
  removeBarrage: (id: string) => void;
  likeBarrage: (id: string) => void;
  setTargetLanguage: (lang: LanguageCode) => Promise<void>;
  setSpeedLevel: (speed: SpeedLevel) => void;
  setFilterKeyword: (keyword: string) => void;
  updateOnlineUsers: () => void;
  incrementTranslationRequests: () => void;
  allocateTrack: (barrageId: string) => number;
  releaseTrack: (trackIndex: number) => void;
  generateInitialBarrages: () => void;
}

const INITIAL_TEXTS: { text: string; lang: LanguageCode }[] = [
  { text: 'Hello everyone!', lang: 'en' },
  { text: 'こんにちは世界', lang: 'ja' },
  { text: '大家好！', lang: 'zh' },
  { text: '안녕하세요!', lang: 'ko' },
  { text: 'Bonjour le monde', lang: 'fr' },
  { text: 'Amazing stream!', lang: 'en' },
  { text: '加油加油！', lang: 'zh' },
  { text: 'すごい！', lang: 'ja' },
  { text: '화이팅!', lang: 'ko' },
  { text: 'Merci beaucoup', lang: 'fr' }
];

const getRandomColor = (): string =>
  BARRAGE_COLORS[Math.floor(Math.random() * BARRAGE_COLORS.length)];

const getRandomSpeed = (): SpeedLevel => {
  const speeds: SpeedLevel[] = ['slow', 'normal', 'fast'];
  return speeds[Math.floor(Math.random() * speeds.length)];
};

export const useBarrageStore = create<BarrageState>((set, get) => ({
  barrages: [],
  settings: {
    targetLanguage: 'zh',
    speedLevel: 'normal',
    filterKeyword: ''
  },
  statistics: {
    onlineUsers: Math.floor(Math.random() * 5000) + 1000,
    totalBarrages: 0,
    translationRequests: 0
  },
  occupiedTracks: new Map(),
  trackCount: 12,
  isTransitioning: false,

  allocateTrack: () => {
    const state = get();
    const { occupiedTracks, trackCount, barrages } = state;
    const now = Date.now();

    for (let i = 0; i < trackCount; i++) {
      const lastTime = occupiedTracks.get(i) ?? 0;
      if (now - lastTime > 2000) {
        const newMap = new Map(occupiedTracks);
        newMap.set(i, now);
        set({ occupiedTracks: newMap });
        return i;
      }
    }

    let oldestIndex = 0;
    let oldestTime = Infinity;
    for (let i = 0; i < trackCount; i++) {
      const t = occupiedTracks.get(i) ?? 0;
      if (t < oldestTime) {
        oldestTime = t;
        oldestIndex = i;
      }
    }
    const newMap = new Map(occupiedTracks);
    newMap.set(oldestIndex, now);
    set({ occupiedTracks: newMap });
    void barrages;
    return oldestIndex;
  },

  releaseTrack: (trackIndex: number) => {
    const state = get();
    const newMap = new Map(state.occupiedTracks);
    newMap.delete(trackIndex);
    set({ occupiedTracks: newMap });
  },

  addBarrage: async (text: string, sourceLang?: LanguageCode) => {
    const state = get();
    const detected = sourceLang ?? languageDetector.detect(text);
    const targetLang = state.settings.targetLanguage;

    const trackIndex = state.allocateTrack('pending');
    const top = (trackIndex / state.trackCount) * 80 + 5;

    const initialTranslations: Partial<Record<LanguageCode, string>> = {};
    if (detected === targetLang) {
      initialTranslations[targetLang] = text;
    }

    const barrage: BarrageItem = {
      id: uuidv4(),
      originalText: text,
      translations: initialTranslations,
      sourceLang: detected,
      color: getRandomColor(),
      top,
      speed: state.settings.speedLevel,
      likes: Math.floor(Math.random() * 10),
      likedByCurrentUser: false,
      createdAt: Date.now()
    };

    let newBarrages = [...state.barrages, barrage];
    if (newBarrages.length > MAX_BARRAGE_COUNT) {
      newBarrages = newBarrages.slice(newBarrages.length - MAX_BARRAGE_COUNT);
    }

    set({
      barrages: newBarrages,
      statistics: {
        ...state.statistics,
        totalBarrages: state.statistics.totalBarrages + 1
      }
    });

    if (detected !== targetLang) {
      try {
        const result = await translatorEngine.translate(text, targetLang, detected);
        const current = get();
        const updated = current.barrages.map((b) =>
          b.id === barrage.id
            ? { ...b, translations: { ...b.translations, [targetLang]: result.translatedText } }
            : b
        );
        set({
          barrages: updated,
          statistics: {
            ...current.statistics,
            translationRequests: current.statistics.translationRequests + 1
          }
        });
      } catch {
        // ignore translation error
      }
    }

    window.setTimeout(() => {
      const cur = get();
      cur.releaseTrack(trackIndex);
      const filtered = cur.barrages.filter((b) => b.id !== barrage.id);
      if (filtered.length !== cur.barrages.length) {
        set({ barrages: filtered });
      }
    }, SPEED_DURATION[state.settings.speedLevel] + 1000);
  },

  removeBarrage: (id: string) => {
    const state = get();
    set({ barrages: state.barrages.filter((b) => b.id !== id) });
  },

  likeBarrage: (id: string) => {
    const state = get();
    set({
      barrages: state.barrages.map((b) =>
        b.id === id
          ? {
              ...b,
              likes: b.likedByCurrentUser ? b.likes : b.likes + 1,
              likedByCurrentUser: true
            }
          : b
      )
    });
  },

  setTargetLanguage: async (lang: LanguageCode) => {
    const state = get();
    if (state.settings.targetLanguage === lang) return;

    set({
      settings: { ...state.settings, targetLanguage: lang },
      isTransitioning: true
    });

    const needTranslate = state.barrages.filter(
      (b) => !b.translations[lang] && b.sourceLang !== lang
    );

    const processBatch = async (items: BarrageItem[]) => {
      for (const b of items) {
        try {
          const result = await translatorEngine.translate(b.originalText, lang, b.sourceLang);
          const cur = get();
          set({
            barrages: cur.barrages.map((item) =>
              item.id === b.id
                ? { ...item, translations: { ...item.translations, [lang]: result.translatedText } }
                : item
            ),
            statistics: {
              ...cur.statistics,
              translationRequests: cur.statistics.translationRequests + 1
            }
          });
        } catch {
          // ignore
        }
      }
    };

    await processBatch(needTranslate.slice(0, 50));
    window.setTimeout(async () => {
      await processBatch(needTranslate.slice(50, 100));
    }, 100);
    window.setTimeout(async () => {
      await processBatch(needTranslate.slice(100));
    }, 200);

    window.setTimeout(() => {
      set({ isTransitioning: false });
    }, 1000);
  },

  setSpeedLevel: (speed: SpeedLevel) => {
    const state = get();
    set({ settings: { ...state.settings, speedLevel: speed } });
  },

  setFilterKeyword: (keyword: string) => {
    const state = get();
    set({ settings: { ...state.settings, filterKeyword: keyword } });
  },

  updateOnlineUsers: () => {
    const state = get();
    const delta = Math.floor(Math.random() * 100) - 50;
    set({
      statistics: {
        ...state.statistics,
        onlineUsers: Math.max(500, state.statistics.onlineUsers + delta)
      }
    });
  },

  incrementTranslationRequests: () => {
    const state = get();
    set({
      statistics: {
        ...state.statistics,
        translationRequests: state.statistics.translationRequests + 1
      }
    });
  },

  generateInitialBarrages: () => {
    void LANGUAGE_OPTIONS;
    INITIAL_TEXTS.forEach((item, index) => {
      window.setTimeout(() => {
        void get().addBarrage(item.text, item.lang);
      }, index * 800);
    });
  }
}));
