import { create } from 'zustand';
import type { PropElement, Character, LightKeyframe, SoundKeyframe, ActiveTool } from '../types';

const STORAGE_KEY = '/stageSchedulerProject';

interface ProjectState {
  props: PropElement[];
  characters: Character[];
  lightKeyframes: LightKeyframe[];
  soundKeyframes: SoundKeyframe[];
  selectedElementId: string | null;
  currentTime: number;
  isPlaying: boolean;
  activeTool: ActiveTool;

  setActiveTool: (tool: ActiveTool) => void;
  selectElement: (id: string | null) => void;
  addProp: (prop: PropElement) => void;
  updateProp: (id: string, updates: Partial<PropElement>) => void;
  removeProp: (id: string) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
  addLightKeyframe: (kf: LightKeyframe) => void;
  updateLightKeyframe: (id: string, updates: Partial<LightKeyframe>) => void;
  removeLightKeyframe: (id: string) => void;
  addSoundKeyframe: (kf: SoundKeyframe) => void;
  updateSoundKeyframe: (id: string, updates: Partial<SoundKeyframe>) => void;
  removeSoundKeyframe: (id: string) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  serialize: () => string;
  deserialize: (json: string) => void;
  loadFromStorage: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const saveToStorage = (): void => {
    try {
      const data = get().serialize();
      localStorage.setItem(STORAGE_KEY, data);
    } catch {
    }
  };

  const initialize = (): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        get().deserialize(stored);
      }
    } catch {
    }
  };

  initialize();

  return {
    props: [],
    characters: [],
    lightKeyframes: [],
    soundKeyframes: [],
    selectedElementId: null,
    currentTime: 0,
    isPlaying: false,
    activeTool: null,

    setActiveTool: (tool: ActiveTool): void => {
      set({ activeTool: tool });
      saveToStorage();
    },

    selectElement: (id: string | null): void => {
      set({ selectedElementId: id });
      saveToStorage();
    },

    addProp: (prop: PropElement): void => {
      set((state) => ({ props: [...state.props, prop] }));
      saveToStorage();
    },

    updateProp: (id: string, updates: Partial<PropElement>): void => {
      set((state) => ({
        props: state.props.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
      saveToStorage();
    },

    removeProp: (id: string): void => {
      set((state) => ({ props: state.props.filter((p) => p.id !== id) }));
      saveToStorage();
    },

    addCharacter: (character: Character): void => {
      set((state) => ({ characters: [...state.characters, character] }));
      saveToStorage();
    },

    updateCharacter: (id: string, updates: Partial<Character>): void => {
      set((state) => ({
        characters: state.characters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
      saveToStorage();
    },

    removeCharacter: (id: string): void => {
      set((state) => ({ characters: state.characters.filter((c) => c.id !== id) }));
      saveToStorage();
    },

    addLightKeyframe: (kf: LightKeyframe): void => {
      set((state) => ({ lightKeyframes: [...state.lightKeyframes, kf] }));
      saveToStorage();
    },

    updateLightKeyframe: (id: string, updates: Partial<LightKeyframe>): void => {
      set((state) => ({
        lightKeyframes: state.lightKeyframes.map((k) => (k.id === id ? { ...k, ...updates } : k)),
      }));
      saveToStorage();
    },

    removeLightKeyframe: (id: string): void => {
      set((state) => ({ lightKeyframes: state.lightKeyframes.filter((k) => k.id !== id) }));
      saveToStorage();
    },

    addSoundKeyframe: (kf: SoundKeyframe): void => {
      set((state) => ({ soundKeyframes: [...state.soundKeyframes, kf] }));
      saveToStorage();
    },

    updateSoundKeyframe: (id: string, updates: Partial<SoundKeyframe>): void => {
      set((state) => ({
        soundKeyframes: state.soundKeyframes.map((k) => (k.id === id ? { ...k, ...updates } : k)),
      }));
      saveToStorage();
    },

    removeSoundKeyframe: (id: string): void => {
      set((state) => ({ soundKeyframes: state.soundKeyframes.filter((k) => k.id !== id) }));
      saveToStorage();
    },

    setCurrentTime: (time: number): void => {
      set({ currentTime: time });
      saveToStorage();
    },

    setIsPlaying: (playing: boolean): void => {
      set({ isPlaying: playing });
      saveToStorage();
    },

    serialize: (): string => {
      const state = get();
      return JSON.stringify({
        props: state.props,
        characters: state.characters,
        lightKeyframes: state.lightKeyframes,
        soundKeyframes: state.soundKeyframes,
        selectedElementId: state.selectedElementId,
        currentTime: state.currentTime,
        isPlaying: state.isPlaying,
        activeTool: state.activeTool,
      });
    },

    deserialize: (json: string): void => {
      try {
        const parsed = JSON.parse(json) as Partial<ProjectState>;
        set({
          props: parsed.props ?? [],
          characters: parsed.characters ?? [],
          lightKeyframes: parsed.lightKeyframes ?? [],
          soundKeyframes: parsed.soundKeyframes ?? [],
          selectedElementId: parsed.selectedElementId ?? null,
          currentTime: parsed.currentTime ?? 0,
          isPlaying: parsed.isPlaying ?? false,
          activeTool: parsed.activeTool ?? null,
        });
      } catch {
      }
    },

    loadFromStorage: (): void => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          get().deserialize(stored);
        }
      } catch {
      }
    },
  };
});
