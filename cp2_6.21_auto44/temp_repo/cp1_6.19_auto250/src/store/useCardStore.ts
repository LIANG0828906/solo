import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { CardType, CardStyleParams, LayoutOffsets, CardInteractionState } from '../types/card';

interface CardState {
  currentCardType: CardType;
  styleParams: CardStyleParams;
  layoutOffsets: LayoutOffsets;
  interactionState: CardInteractionState;
  previewWidth: number;

  setCardType: (type: CardType) => void;
  setBorderRadius: (value: number) => void;
  setShadowIntensity: (value: number) => void;
  setLayoutOffset: (key: keyof LayoutOffsets, value: number) => void;
  setHovered: (value: boolean) => void;
  toggleFlip: () => void;
  setEditMode: (value: boolean) => void;
  setPreviewWidth: (value: number) => void;
}

interface CardActions {
  setCardType: (type: CardType) => void;
  setBorderRadius: (value: number) => void;
  setShadowIntensity: (value: number) => void;
  setLayoutOffset: (key: keyof LayoutOffsets, value: number) => void;
  setHovered: (value: boolean) => void;
  toggleFlip: () => void;
  setEditMode: (value: boolean) => void;
  setPreviewWidth: (value: number) => void;
}

export const useCardStore = create<CardState>((set) => ({
  currentCardType: 'info',
  styleParams: {
    borderRadius: 16,
    shadowIntensity: 8,
  },
  layoutOffsets: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  interactionState: {
    isHovered: false,
    isFlipped: false,
    isEditMode: false,
  },
  previewWidth: 400,

  setCardType: (type) => set({ currentCardType: type }),
  setBorderRadius: (value) => set((state) => ({
    styleParams: { ...state.styleParams, borderRadius: value }
  })),
  setShadowIntensity: (value) => set((state) => ({
    styleParams: { ...state.styleParams, shadowIntensity: value }
  })),
  setLayoutOffset: (key, value) => set((state) => ({
    layoutOffsets: { ...state.layoutOffsets, [key]: value }
  })),
  setHovered: (value) => set((state) => ({
    interactionState: { ...state.interactionState, isHovered: value }
  })),
  toggleFlip: () => set((state) => ({
    interactionState: { ...state.interactionState, isFlipped: !state.interactionState.isFlipped }
  })),
  setEditMode: (value) => set((state) => ({
    interactionState: { ...state.interactionState, isEditMode: value }
  })),
  setPreviewWidth: (value) => set({ previewWidth: value }),
}));

export function useCardType(): CardType {
  return useCardStore((state) => state.currentCardType);
}

export function useStyleParams(): CardStyleParams {
  return useCardStore(useShallow((state) => state.styleParams));
}

export function useLayoutOffsets(): LayoutOffsets {
  return useCardStore(useShallow((state) => state.layoutOffsets));
}

export function useInteractionState(): CardInteractionState {
  return useCardStore(useShallow((state) => state.interactionState));
}

export function usePreviewWidth(): number {
  return useCardStore((state) => state.previewWidth);
}

export function useCardActions(): CardActions {
  return useCardStore(useShallow((state) => ({
    setCardType: state.setCardType,
    setBorderRadius: state.setBorderRadius,
    setShadowIntensity: state.setShadowIntensity,
    setLayoutOffset: state.setLayoutOffset,
    setHovered: state.setHovered,
    toggleFlip: state.toggleFlip,
    setEditMode: state.setEditMode,
    setPreviewWidth: state.setPreviewWidth,
  })));
}
