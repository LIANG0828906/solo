import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  GestureType,
  AnimationType,
  GestureMapping,
  CustomTemplate,
  HistoryItem,
  DEFAULT_MAPPINGS,
  STORAGE_KEY,
  MAX_CUSTOM_TEMPLATES,
  Point,
} from './types';
import { generateThumbnail } from './gestureEngine';

interface AppState {
  gestureMappings: GestureMapping[];
  customTemplates: CustomTemplate[];
  currentGesture: GestureType | null;
  currentAnimation: AnimationType | null;
  isTrainingMode: boolean;
  isSettingsOpen: boolean;
  recognitionHistory: HistoryItem[];
  matchPercentage: number;
  lastRecognitionConfidence: number;
  trainingSelectedTemplate: CustomTemplate | null;
  customTextForFlash: string;

  setGestureMapping: (gesture: GestureType, animation: AnimationType) => void;
  addCustomTemplate: (data: {
    name: string;
    points: Point[];
    gestureType: GestureType;
  }) => { success: boolean; message?: string; template?: CustomTemplate };
  removeCustomTemplate: (id: string) => void;
  setCurrentRecognition: (gesture: GestureType, animation: AnimationType, confidence: number) => void;
  toggleTrainingMode: () => void;
  toggleSettings: () => void;
  setMatchPercentage: (p: number) => void;
  clearCurrentGesture: () => void;
  setTrainingSelectedTemplate: (tpl: CustomTemplate | null) => void;
  setCustomTextForFlash: (text: string) => void;
  resetMappings: () => void;
  resetAll: () => void;
  getAnimationForGesture: (gesture: GestureType) => AnimationType;
}

const initialMappings = [...DEFAULT_MAPPINGS];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      gestureMappings: initialMappings,
      customTemplates: [],
      currentGesture: null,
      currentAnimation: null,
      isTrainingMode: false,
      isSettingsOpen: false,
      recognitionHistory: [],
      matchPercentage: 0,
      lastRecognitionConfidence: 0,
      trainingSelectedTemplate: null,
      customTextForFlash: '✨ 手势识别成功！',

      setGestureMapping: (gesture, animation) => {
        set((state) => {
          const existing = state.gestureMappings.findIndex((m) => m.gesture === gesture);
          const next = [...state.gestureMappings];
          if (existing >= 0) {
            next[existing] = { ...next[existing], animation };
          } else {
            next.push({ gesture, animation });
          }
          return { gestureMappings: next };
        });
      },

      addCustomTemplate: (data) => {
        const state = get();
        if (state.customTemplates.length >= MAX_CUSTOM_TEMPLATES) {
          return { success: false, message: `最多只能保存 ${MAX_CUSTOM_TEMPLATES} 个自定义模板` };
        }
        const thumbnail = generateThumbnail(data.points);
        const template: CustomTemplate = {
          id: uuidv4(),
          name: data.name || `模板 ${state.customTemplates.length + 1}`,
          points: data.points,
          thumbnailData: thumbnail,
          createdAt: Date.now(),
          gestureType: data.gestureType || 'CUSTOM',
        };
        set((s) => ({ customTemplates: [...s.customTemplates, template] }));
        return { success: true, template };
      },

      removeCustomTemplate: (id) => {
        set((state) => ({
          customTemplates: state.customTemplates.filter((t) => t.id !== id),
          trainingSelectedTemplate:
            state.trainingSelectedTemplate?.id === id ? null : state.trainingSelectedTemplate,
        }));
      },

      setCurrentRecognition: (gesture, animation, confidence) => {
        set((state) => {
          const history: HistoryItem[] = [
            {
              id: uuidv4(),
              gesture,
              animation,
              timestamp: Date.now(),
            },
            ...state.recognitionHistory,
          ].slice(0, 20);
          return {
            currentGesture: gesture,
            currentAnimation: animation,
            lastRecognitionConfidence: confidence,
            recognitionHistory: history,
          };
        });
      },

      toggleTrainingMode: () =>
        set((s) => ({ isTrainingMode: !s.isTrainingMode, matchPercentage: 0, trainingSelectedTemplate: null })),

      toggleSettings: () => set((s) => ({ isSettingsOpen: !s.isSettingsOpen })),

      setMatchPercentage: (p) => set({ matchPercentage: p }),

      clearCurrentGesture: () => set({ currentGesture: null, currentAnimation: null }),

      setTrainingSelectedTemplate: (tpl) => set({ trainingSelectedTemplate: tpl, matchPercentage: 0 }),

      setCustomTextForFlash: (text) => set({ customTextForFlash: text }),

      resetMappings: () => set({ gestureMappings: [...DEFAULT_MAPPINGS] }),

      resetAll: () =>
        set({
          gestureMappings: [...DEFAULT_MAPPINGS],
          customTemplates: [],
          recognitionHistory: [],
          trainingSelectedTemplate: null,
          customTextForFlash: '✨ 手势识别成功！',
        }),

      getAnimationForGesture: (gesture) => {
        const mapping = get().gestureMappings.find((m) => m.gesture === gesture);
        return mapping?.animation ?? 'NONE';
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        gestureMappings: state.gestureMappings,
        customTemplates: state.customTemplates,
        customTextForFlash: state.customTextForFlash,
      }),
    }
  )
);
