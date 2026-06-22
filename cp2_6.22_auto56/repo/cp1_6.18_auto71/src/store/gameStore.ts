import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Capsule, GameStoreActions, GameStoreState, LogEntry, CapsuleColor } from '../types';
import { addCapsule as apiAddCapsule, fetchCapsules as apiFetchCapsules, openCapsule as apiOpenCapsule } from '../services/dataService';

const initialState: GameStoreState = {
  capsules: [],
  logs: [],
  selectedCapsuleId: null,
  showEditor: false,
  editorPosition: null,
  showModal: false,
  modalCapsule: null,
  panelCollapsed: false,
  isLoading: false,
  focusedCapsuleId: null
};

function makeSummary(content: string, emoji: string): string {
  const stripped = content.trim();
  if (stripped.length <= 10) return `${emoji} ${stripped}`;
  return `${emoji} ${stripped.slice(0, 10)}...`;
}

function buildLogsFromCapsules(capsules: Capsule[]): LogEntry[] {
  return capsules
    .filter(c => c.isOpened && c.isMine)
    .sort((a, b) => (b.openedAt || 0) - (a.openedAt || 0))
    .slice(0, 5)
    .map(c => ({
      id: uuidv4(),
      capsuleId: c.id,
      summary: makeSummary(c.content, c.emoji),
      openedAt: c.openedAt || 0
    }));
}

export const useGameStore = create<GameStoreState & GameStoreActions>((set, get) => ({
  ...initialState,

  setShowEditor: (show, position = null) => {
    set({ showEditor: show, editorPosition: position });
  },

  setShowModal: (show, capsule = null) => {
    set({ showModal: show, modalCapsule: capsule });
  },

  setSelectedCapsule: (id) => {
    set({ selectedCapsuleId: id });
  },

  togglePanel: () => {
    set(s => ({ panelCollapsed: !s.panelCollapsed }));
  },

  fetchCapsules: async () => {
    set({ isLoading: true });
    try {
      const capsules = await apiFetchCapsules();
      set({
        capsules,
        logs: buildLogsFromCapsules(capsules),
        isLoading: false
      });
    } catch (err) {
      console.error('fetch capsules failed:', err);
      set({ isLoading: false });
    }
  },

  addCapsule: async (data) => {
    set({ isLoading: true });
    try {
      const created = await apiAddCapsule({
        position: data.position,
        color: data.color as CapsuleColor,
        emoji: data.emoji,
        content: data.content,
        isMine: true
      });
      const state = get();
      const capsules = [...state.capsules, created];
      set({
        capsules,
        isLoading: false,
        showEditor: false,
        editorPosition: null
      });
    } catch (err) {
      console.error('add capsule failed:', err);
      set({ isLoading: false });
    }
  },

  openCapsule: async (id) => {
    set({ isLoading: true });
    try {
      const opened = await apiOpenCapsule(id);
      if (!opened) {
        set({ isLoading: false });
        return;
      }
      const state = get();
      const capsules = state.capsules.map(c => (c.id === id ? opened : c));
      const logs = buildLogsFromCapsules(capsules);
      set({
        capsules,
        logs,
        isLoading: false,
        showModal: true,
        modalCapsule: opened,
        selectedCapsuleId: id
      });
    } catch (err) {
      console.error('open capsule failed:', err);
      set({ isLoading: false });
    }
  },

  focusCapsule: (id) => {
    set({ focusedCapsuleId: id });
  },

  clearFocusedCapsule: () => {
    set({ focusedCapsuleId: null });
  }
}));
