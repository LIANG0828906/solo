import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Story,
  Panel,
  Character,
  Dialog,
  PlaybackStatus,
  PlaybackSpeed,
  PresetCharacter,
} from '@/types/story';

export const PRESET_CHARACTERS: PresetCharacter[] = [
  { type: 'boy', emoji: '👦', name: '小男孩' },
  { type: 'girl', emoji: '👧', name: '小女孩' },
  { type: 'robot', emoji: '🤖', name: '机器人' },
  { type: 'cat', emoji: '🐱', name: '小猫咪' },
];

export const COLOR_PALETTE = [
  '#F0F0F0',
  '#FFE5E5',
  '#FFF2CC',
  '#D9F2E6',
  '#D9E8FF',
  '#E5D9FF',
  '#FFD9E8',
  '#FFE8CC',
  '#CCF2F2',
  '#E6E6FA',
  '#FAEBD7',
  '#F5F5DC',
];

const createInitialPanel = (index: number): Panel => ({
  id: uuidv4(),
  index,
  backgroundColor: '#F0F0F0',
  backgroundImage: undefined,
  width: 800,
  height: 600,
  characters: [],
});

const createInitialStory = (): Story => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: '我的漫画故事',
    panels: [createInitialPanel(0)],
    createdAt: now,
    updatedAt: now,
  };
};

interface StoryState {
  story: Story;
  currentPanelIndex: number;
  playbackStatus: PlaybackStatus;
  playbackSpeed: PlaybackSpeed;
  isPlayerMode: boolean;
  addingPanel: boolean;
  removingPanelId: string | null;

  setCurrentPanelIndex: (index: number) => void;
  addPanel: () => void;
  deletePanel: (panelId: string) => void;
  confirmDeletePanel: () => void;
  cancelDeletePanel: () => void;
  reorderPanels: (fromIndex: number, toIndex: number) => void;
  updatePanelBackground: (panelId: string, backgroundColor?: string, backgroundImage?: string) => void;

  addCharacter: (panelId: string, preset: PresetCharacter, x: number, y: number) => void;
  removeCharacter: (panelId: string, characterId: string) => void;
  updateCharacterPosition: (panelId: string, characterId: string, x: number, y: number) => void;
  updateCharacterDialog: (panelId: string, characterId: string, text: string) => void;

  enterPlayerMode: () => void;
  exitPlayerMode: () => void;
  play: () => void;
  pause: () => void;
  nextPanel: () => void;
  prevPanel: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;

  newStory: () => void;
  saveStory: () => void;
  exportStory: () => void;
  generateShareCode: () => string;
  loadStory: (story: Story) => void;
}

const STORAGE_KEY = 'pixelstory_stories';

export const useStore = create<StoryState>((set, get) => ({
  story: createInitialStory(),
  currentPanelIndex: 0,
  playbackStatus: 'idle',
  playbackSpeed: 1,
  isPlayerMode: false,
  addingPanel: false,
  removingPanelId: null,

  setCurrentPanelIndex: (index) => {
    const state = get();
    if (index >= 0 && index < state.story.panels.length) {
      set({ currentPanelIndex: index });
    }
  },

  addPanel: () => {
    set({ addingPanel: true });
    setTimeout(() => {
      set((state) => {
        const newIndex = state.story.panels.length;
        const newPanel = createInitialPanel(newIndex);
        return {
          story: {
            ...state.story,
            panels: [...state.story.panels, newPanel],
            updatedAt: new Date().toISOString(),
          },
          currentPanelIndex: newIndex,
          addingPanel: false,
        };
      });
    }, 50);
  },

  deletePanel: (panelId) => {
    set({ removingPanelId: panelId });
  },

  confirmDeletePanel: () => {
    set((state) => {
      if (!state.removingPanelId) return { removingPanelId: null };
      const panels = state.story.panels.filter((p) => p.id !== state.removingPanelId);
      const reindexedPanels = panels.map((p, i) => ({ ...p, index: i }));
      let newCurrentIndex = state.currentPanelIndex;
      if (newCurrentIndex >= reindexedPanels.length) {
        newCurrentIndex = Math.max(0, reindexedPanels.length - 1);
      }
      if (reindexedPanels.length === 0) {
        reindexedPanels.push(createInitialPanel(0));
        newCurrentIndex = 0;
      }
      return {
        story: {
          ...state.story,
          panels: reindexedPanels,
          updatedAt: new Date().toISOString(),
        },
        currentPanelIndex: newCurrentIndex,
        removingPanelId: null,
      };
    });
  },

  cancelDeletePanel: () => {
    set({ removingPanelId: null });
  },

  reorderPanels: (fromIndex, toIndex) => {
    set((state) => {
      const panels = [...state.story.panels];
      const [moved] = panels.splice(fromIndex, 1);
      panels.splice(toIndex, 0, moved);
      const reindexed = panels.map((p, i) => ({ ...p, index: i }));
      let newCurrentIndex = state.currentPanelIndex;
      if (state.currentPanelIndex === fromIndex) {
        newCurrentIndex = toIndex;
      } else if (fromIndex < state.currentPanelIndex && toIndex >= state.currentPanelIndex) {
        newCurrentIndex = state.currentPanelIndex - 1;
      } else if (fromIndex > state.currentPanelIndex && toIndex <= state.currentPanelIndex) {
        newCurrentIndex = state.currentPanelIndex + 1;
      }
      return {
        story: {
          ...state.story,
          panels: reindexed,
          updatedAt: new Date().toISOString(),
        },
        currentPanelIndex: newCurrentIndex,
      };
    });
  },

  updatePanelBackground: (panelId, backgroundColor, backgroundImage) => {
    set((state) => ({
      story: {
        ...state.story,
        panels: state.story.panels.map((p) =>
          p.id === panelId
            ? {
                ...p,
                backgroundColor: backgroundColor ?? p.backgroundColor,
                backgroundImage: backgroundImage !== undefined ? backgroundImage : p.backgroundImage,
              }
            : p
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  addCharacter: (panelId, preset, x, y) => {
    const newCharacter: Character = {
      id: uuidv4(),
      type: preset.type,
      emoji: preset.emoji,
      name: preset.name,
      x,
      y,
      dialog: undefined,
    };
    set((state) => ({
      story: {
        ...state.story,
        panels: state.story.panels.map((p) =>
          p.id === panelId ? { ...p, characters: [...p.characters, newCharacter] } : p
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  removeCharacter: (panelId, characterId) => {
    set((state) => ({
      story: {
        ...state.story,
        panels: state.story.panels.map((p) =>
          p.id === panelId
            ? { ...p, characters: p.characters.filter((c) => c.id !== characterId) }
            : p
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateCharacterPosition: (panelId, characterId, x, y) => {
    set((state) => ({
      story: {
        ...state.story,
        panels: state.story.panels.map((p) =>
          p.id === panelId
            ? {
                ...p,
                characters: p.characters.map((c) =>
                  c.id === characterId ? { ...c, x, y } : c
                ),
              }
            : p
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateCharacterDialog: (panelId, characterId, text) => {
    set((state) => ({
      story: {
        ...state.story,
        panels: state.story.panels.map((p) =>
          p.id === panelId
            ? {
                ...p,
                characters: p.characters.map((c) => {
                  if (c.id !== characterId) return c;
                  if (!text.trim()) {
                    const { dialog: _, ...rest } = c;
                    return rest as Character;
                  }
                  const dialog: Dialog = {
                    id: c.dialog?.id ?? uuidv4(),
                    text: text.trim(),
                    direction: c.x < 400 ? 'right' : 'left',
                  };
                  return { ...c, dialog };
                }),
              }
            : p
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  enterPlayerMode: () => {
    set({
      isPlayerMode: true,
      currentPanelIndex: 0,
      playbackStatus: 'idle',
    });
  },

  exitPlayerMode: () => {
    set({
      isPlayerMode: false,
      playbackStatus: 'idle',
    });
  },

  play: () => {
    const state = get();
    if (state.currentPanelIndex >= state.story.panels.length - 1 && state.playbackStatus === 'finished') {
      set({ currentPanelIndex: 0 });
    }
    set({ playbackStatus: 'playing' });
  },

  pause: () => {
    set({ playbackStatus: 'paused' });
  },

  nextPanel: () => {
    set((state) => {
      const nextIdx = state.currentPanelIndex + 1;
      if (nextIdx >= state.story.panels.length) {
        return { playbackStatus: 'finished' };
      }
      return { currentPanelIndex: nextIdx };
    });
  },

  prevPanel: () => {
    set((state) => {
      const prevIdx = state.currentPanelIndex - 1;
      if (prevIdx < 0) return {};
      return { currentPanelIndex: prevIdx };
    });
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: speed });
  },

  newStory: () => {
    set({
      story: createInitialStory(),
      currentPanelIndex: 0,
      playbackStatus: 'idle',
      isPlayerMode: false,
    });
  },

  saveStory: () => {
    const state = get();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stories = raw ? JSON.parse(raw) : {};
      stories[state.story.id] = state.story;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    } catch {
      console.warn('保存失败');
    }
  },

  exportStory: () => {
    const state = get();
    const json = JSON.stringify(state.story, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.story.title || 'pixelstory'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  generateShareCode: () => {
    const state = get();
    const code = Math.random().toString(36).slice(2, 10);
    try {
      const raw = localStorage.getItem('pixelstory_shares');
      const shares = raw ? JSON.parse(raw) : {};
      shares[code] = state.story.id;
      localStorage.setItem('pixelstory_shares', JSON.stringify(shares));
      const storiesRaw = localStorage.getItem(STORAGE_KEY);
      const stories = storiesRaw ? JSON.parse(storiesRaw) : {};
      stories[state.story.id] = state.story;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    } catch {
      console.warn('分享码生成失败');
    }
    return code;
  },

  loadStory: (story) => {
    set({
      story,
      currentPanelIndex: 0,
      playbackStatus: 'idle',
      isPlayerMode: false,
    });
  },
}));
