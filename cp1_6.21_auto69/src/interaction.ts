import type { Earthquake } from './quakeData';

export interface InteractionState {
  selectedQuake: Earthquake | null;
  hoveredQuakeId: string | null;
  panelPosition: { x: number; y: number } | null;
}

export type InteractionCallback = (state: InteractionState) => void;

export function createInteractionManager() {
  let callback: InteractionCallback | null = null;
  let state: InteractionState = {
    selectedQuake: null,
    hoveredQuakeId: null,
    panelPosition: null,
  };

  function setCallback(cb: InteractionCallback) {
    callback = cb;
  }

  function notifyChange() {
    if (callback) {
      callback({ ...state });
    }
  }

  function onQuakeClick(quake: Earthquake, screenPos: { x: number; y: number }) {
    state = {
      ...state,
      selectedQuake: quake,
      panelPosition: screenPos,
    };
    notifyChange();
  }

  function onQuakeHover(quakeId: string | null) {
    if (state.hoveredQuakeId === quakeId) return;
    state = {
      ...state,
      hoveredQuakeId: quakeId,
    };
    notifyChange();
  }

  function closePanel() {
    state = {
      ...state,
      selectedQuake: null,
      panelPosition: null,
    };
    notifyChange();
  }

  function getState(): InteractionState {
    return { ...state };
  }

  return {
    setCallback,
    onQuakeClick,
    onQuakeHover,
    closePanel,
    getState,
  };
}

export type InteractionManager = ReturnType<typeof createInteractionManager>;
