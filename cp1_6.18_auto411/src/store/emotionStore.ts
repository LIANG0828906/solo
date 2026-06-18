import { create } from 'zustand';
import {
  ColorEmotion,
  EmotionType,
  EmotionWeights,
  createEmptyWeights,
  ALL_EMOTIONS,
} from '@/data/colors';
import { v4 as uuidv4 } from 'uuid';

interface SelectedColor {
  id: string;
  color: string;
  colorData: ColorEmotion;
  selectedAt: number;
}

interface HistoryRecord {
  id: string;
  selectedColorIds: string[];
  dominantEmotion: EmotionType;
  emotionWeights: EmotionWeights;
  createdAt: number;
}

interface EmotionStore {
  selectedColors: SelectedColor[];
  history: HistoryRecord[];
  emotionWeights: EmotionWeights;
  dominantEmotion: EmotionType | null;
  latestSelectedAt: number | null;
  selectColor: (colorData: ColorEmotion) => void;
  removeColor: (colorId: string) => void;
  calculateResult: () => void;
  resetSelection: () => void;
  clearAll: () => void;
}

const MAX_SELECTION = 3;

export const useEmotionStore = create<EmotionStore>((set, get) => ({
  selectedColors: [],
  history: [],
  emotionWeights: createEmptyWeights(),
  dominantEmotion: null,
  latestSelectedAt: null,

  selectColor: (colorData: ColorEmotion) => {
    const state = get();
    if (state.selectedColors.length >= MAX_SELECTION) return;
    if (state.selectedColors.some((sc) => sc.id === colorData.id)) return;

    const selectedAt = Date.now();
    set({
      selectedColors: [
        ...state.selectedColors,
        {
          id: colorData.id,
          color: colorData.color,
          colorData,
          selectedAt,
        },
      ],
      latestSelectedAt: selectedAt,
    });
  },

  removeColor: (colorId: string) => {
    const state = get();
    set({
      selectedColors: state.selectedColors.filter((sc) => sc.id !== colorId),
    });
  },

  calculateResult: () => {
    const state = get();
    if (state.selectedColors.length === 0) return;

    const weights = createEmptyWeights();
    const lastSelectedByEmotion: Partial<Record<EmotionType, number>> = {};

    state.selectedColors.forEach((sc) => {
      sc.colorData.emotions.forEach(({ type, weight }) => {
        weights[type] = +(weights[type] + weight).toFixed(2);
        const prev = lastSelectedByEmotion[type] ?? 0;
        if (sc.selectedAt > prev) {
          lastSelectedByEmotion[type] = sc.selectedAt;
        }
      });
    });

    let maxWeight = -1;
    let dominant: EmotionType = ALL_EMOTIONS[0];
    let tieLatest = -1;

    ALL_EMOTIONS.forEach((emo) => {
      if (weights[emo] > maxWeight) {
        maxWeight = weights[emo];
        dominant = emo;
        tieLatest = lastSelectedByEmotion[emo] ?? 0;
      } else if (weights[emo] === maxWeight) {
        const curLatest = lastSelectedByEmotion[emo] ?? 0;
        if (curLatest > tieLatest) {
          dominant = emo;
          tieLatest = curLatest;
        }
      }
    });

    const maxPossible = state.selectedColors.length * 2;
    const scale = maxPossible > 0 ? 10 / maxPossible : 1;
    const normalizedWeights: EmotionWeights = { ...weights };
    ALL_EMOTIONS.forEach((emo) => {
      normalizedWeights[emo] = Math.min(10, +(normalizedWeights[emo] * scale).toFixed(2));
    });

    const historyRecord: HistoryRecord = {
      id: uuidv4(),
      selectedColorIds: state.selectedColors.map((sc) => sc.id),
      dominantEmotion: dominant,
      emotionWeights: normalizedWeights,
      createdAt: Date.now(),
    };

    set({
      emotionWeights: normalizedWeights,
      dominantEmotion: dominant,
      history: [historyRecord, ...state.history].slice(0, 10),
    });
  },

  resetSelection: () => {
    set({
      selectedColors: [],
      emotionWeights: createEmptyWeights(),
      dominantEmotion: null,
      latestSelectedAt: null,
    });
  },

  clearAll: () => {
    set({
      selectedColors: [],
      history: [],
      emotionWeights: createEmptyWeights(),
      dominantEmotion: null,
      latestSelectedAt: null,
    });
  },
}));
