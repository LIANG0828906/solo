import { create } from 'zustand';
import type { AppState, AppActions, ElementType, SceneElement, ThemeType } from '../types';
import { elementDefaults } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialFrequencyData = new Uint8Array(128);
const initialTimeData = new Uint8Array(128);

export const useStore = create<AppState & AppActions>((set, get) => ({
  elements: [],
  selectedElementId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  theme: 'cyberpunk',
  frequencyData: initialFrequencyData,
  timeData: initialTimeData,
  isRecording: false,
  audioLoaded: false,

  addElement: (type: ElementType, id?: string) => {
    const defaults = elementDefaults[type];
    const elementId = id || generateId();
    const newElement: SceneElement = {
      id: elementId,
      type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      sensitivity: 1,
      rotationSpeed: 0.5,
      ...defaults,
    };
    set((state) => ({
      elements: [...state.elements, newElement],
      selectedElementId: elementId,
    }));
  },

  removeElement: (id: string) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
  },

  updateElement: (id: string, props: Partial<SceneElement>) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...props } : el
      ),
    }));
  },

  selectElement: (id: string | null) => {
    set({ selectedElementId: id });
  },

  setTheme: (theme: ThemeType) => {
    set({ theme });
  },

  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
  },

  setDuration: (duration: number) => {
    set({ duration });
  },

  setFrequencyData: (data: Uint8Array) => {
    set({ frequencyData: data });
  },

  setTimeData: (data: Uint8Array) => {
    set({ timeData: data });
  },

  setRecording: (recording: boolean) => {
    set({ isRecording: recording });
  },

  setAudioLoaded: (loaded: boolean) => {
    set({ audioLoaded: loaded });
  },

  syncAllElements: () => {
    const { elements } = get();
    elements.forEach((el) => {
      // Reset element animation state for sync
      // This is handled in the element components via key updates or refs
    });
    // Trigger a re-render by creating new array reference
    set({ elements: [...elements] });
  },
}));

export function getFrequencyData(): Uint8Array {
  return useStore.getState().frequencyData;
}

export function getCurrentTheme(): ThemeType {
  return useStore.getState().theme;
}

export function getElementById(id: string): SceneElement | undefined {
  return useStore.getState().elements.find((el) => el.id === id);
}
