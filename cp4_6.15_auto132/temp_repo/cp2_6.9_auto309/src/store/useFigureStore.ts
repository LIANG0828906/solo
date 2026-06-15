import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { FigureData, PoseState, ColorLayer, GoldLeaf } from '@/types';
import { createDefaultPose, poseOptions } from '@/constants/poseList';
import { defaultBaseColors } from '@/constants/colorPalette';

interface FigureStore {
  figureData: FigureData;
  currentPoseOptionId: string;
  showTutorial: boolean;
  tutorialStep: number;
  showShareModal: boolean;
  isKneading: boolean;
  isPainting: boolean;
  isGilding: boolean;
  creatorName: string;
  figureName: string;

  setPoseOption: (poseId: string) => void;
  updatePose: (updates: Partial<PoseState>) => void;
  setBaseColor: (color: string) => void;
  addColorLayer: (layer: Omit<ColorLayer, 'id'>) => void;
  updateColorLayer: (id: string, updates: Partial<ColorLayer>) => void;
  removeColorLayer: (id: string) => void;
  setGoldLeaf: (goldLeaf: Partial<GoldLeaf>) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setIsGilded: (value: boolean) => void;
  setShowTutorial: (value: boolean) => void;
  setTutorialStep: (step: number) => void;
  setShowShareModal: (value: boolean) => void;
  setIsKneading: (value: boolean) => void;
  setIsPainting: (value: boolean) => void;
  setIsGilding: (value: boolean) => void;
  setCreatorName: (name: string) => void;
  setFigureName: (name: string) => void;
  resetFigure: () => void;
}

const createInitialState = (): FigureData => {
  const defaultPose = createDefaultPose(poseOptions[0].id);
  return {
    pose: defaultPose,
    baseColor: defaultBaseColors.skin,
    colorLayers: [
      {
        id: uuidv4(),
        name: '裙青色',
        type: 'base',
        color: defaultBaseColors.skirt,
        opacity: 1,
      },
      {
        id: uuidv4(),
        name: '披帛红色',
        type: 'base',
        color: defaultBaseColors.shawl,
        opacity: 1,
      },
    ],
    goldLeaf: {
      id: uuidv4(),
      area: 40,
      positions: [],
    },
    currentStep: 0,
    isGilded: false,
  };
};

export const useFigureStore = create<FigureStore>((set, get) => ({
  figureData: createInitialState(),
  currentPoseOptionId: poseOptions[0].id,
  showTutorial: true,
  tutorialStep: 0,
  showShareModal: false,
  isKneading: false,
  isPainting: false,
  isGilding: false,
  creatorName: '匿名匠人',
  figureName: '慈悲菩萨像',

  setPoseOption: (poseId: string) => {
    const newPose = createDefaultPose(poseId);
    set((state) => ({
      currentPoseOptionId: poseId,
      figureData: {
        ...state.figureData,
        pose: newPose,
      },
    }));
  },

  updatePose: (updates: Partial<PoseState>) => {
    set((state) => ({
      figureData: {
        ...state.figureData,
        pose: {
          ...state.figureData.pose,
          ...updates,
        },
      },
    }));
  },

  setBaseColor: (color: string) => {
    set((state) => ({
      figureData: {
        ...state.figureData,
        baseColor: color,
      },
    }));
  },

  addColorLayer: (layer: Omit<ColorLayer, 'id'>) => {
    const newLayer: ColorLayer = {
      ...layer,
      id: uuidv4(),
    };
    set((state) => ({
      figureData: {
        ...state.figureData,
        colorLayers: [...state.figureData.colorLayers, newLayer],
      },
    }));
  },

  updateColorLayer: (id: string, updates: Partial<ColorLayer>) => {
    set((state) => ({
      figureData: {
        ...state.figureData,
        colorLayers: state.figureData.colorLayers.map((layer) =>
          layer.id === id ? { ...layer, ...updates } : layer
        ),
      },
    }));
  },

  removeColorLayer: (id: string) => {
    set((state) => ({
      figureData: {
        ...state.figureData,
        colorLayers: state.figureData.colorLayers.filter(
          (layer) => layer.id !== id
        ),
      },
    }));
  },

  setGoldLeaf: (goldLeaf: Partial<GoldLeaf>) => {
    set((state) => ({
      figureData: {
        ...state.figureData,
        goldLeaf: {
          ...state.figureData.goldLeaf,
          ...goldLeaf,
        },
      },
    }));
  },

  setCurrentStep: (step: number) => {
    set((state) => ({
      figureData: {
        ...state.figureData,
        currentStep: Math.max(0, Math.min(6, step)),
      },
    }));
  },

  nextStep: () => {
    const { figureData } = get();
    if (figureData.currentStep < 6) {
      set((state) => ({
        figureData: {
          ...state.figureData,
          currentStep: state.figureData.currentStep + 1,
        },
      }));
    }
  },

  prevStep: () => {
    const { figureData } = get();
    if (figureData.currentStep > 0) {
      set((state) => ({
        figureData: {
          ...state.figureData,
          currentStep: state.figureData.currentStep - 1,
        },
      }));
    }
  },

  setIsGilded: (value: boolean) => {
    set((state) => ({
      figureData: {
        ...state.figureData,
        isGilded: value,
      },
    }));
  },

  setShowTutorial: (value: boolean) => {
    set({ showTutorial: value });
  },

  setTutorialStep: (step: number) => {
    set({ tutorialStep: step });
  },

  setShowShareModal: (value: boolean) => {
    set({ showShareModal: value });
  },

  setIsKneading: (value: boolean) => {
    set({ isKneading: value });
  },

  setIsPainting: (value: boolean) => {
    set({ isPainting: value });
  },

  setIsGilding: (value: boolean) => {
    set({ isGilding: value });
  },

  setCreatorName: (name: string) => {
    set({ creatorName: name });
  },

  setFigureName: (name: string) => {
    set({ figureName: name });
  },

  resetFigure: () => {
    set({
      figureData: createInitialState(),
      currentPoseOptionId: poseOptions[0].id,
    });
  },
}));
