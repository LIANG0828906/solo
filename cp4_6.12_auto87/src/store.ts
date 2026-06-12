import { create } from 'zustand';

export interface Snapshot {
  id: string;
  timestamp: number;
  weibo: string;
  officialAccount: string;
  seo: string;
}

interface AppState {
  versions: Snapshot[];
  selectedVersionId: string | null;
  currentEditorText: string;
  currentWeibo: string;
  currentOfficialAccount: string;
  currentSeo: string;
  keywords: string[];
  setCurrentEditorText: (text: string) => void;
  setProcessedResults: (data: {
    weibo: string;
    officialAccount: string;
    seo: string;
    keywords: string[];
  }) => void;
  setCurrentWeibo: (text: string) => void;
  setCurrentOfficialAccount: (text: string) => void;
  setCurrentSeo: (text: string) => void;
  addVersion: (snapshot: Snapshot) => void;
  selectVersion: (id: string | null) => void;
  rollbackToVersion: (id: string) => void;
  clearAll: () => void;
}

const MAX_VERSIONS = 100;

export const useAppStore = create<AppState>((set, get) => ({
  versions: [],
  selectedVersionId: null,
  currentEditorText: '',
  currentWeibo: '',
  currentOfficialAccount: '',
  currentSeo: '',
  keywords: [],

  setCurrentEditorText: (text) => set({ currentEditorText: text }),

  setProcessedResults: ({ weibo, officialAccount, seo, keywords }) =>
    set({
      currentWeibo: weibo,
      currentOfficialAccount: officialAccount,
      currentSeo: seo,
      keywords,
      selectedVersionId: null,
    }),

  setCurrentWeibo: (text) => set({ currentWeibo: text }),
  setCurrentOfficialAccount: (text) => set({ currentOfficialAccount: text }),
  setCurrentSeo: (text) => set({ currentSeo: text }),

  addVersion: (snapshot) => {
    const current = get().versions;
    const updated = [snapshot, ...current];
    if (updated.length > MAX_VERSIONS) {
      updated.length = MAX_VERSIONS;
    }
    set({ versions: updated });
  },

  selectVersion: (id) => set({ selectedVersionId: id }),

  rollbackToVersion: (id) => {
    const snapshot = get().versions.find(v => v.id === id);
    if (snapshot) {
      set({
        currentWeibo: snapshot.weibo,
        currentOfficialAccount: snapshot.officialAccount,
        currentSeo: snapshot.seo,
        selectedVersionId: id,
      });
    }
  },

  clearAll: () => set({
    versions: [],
    selectedVersionId: null,
    currentEditorText: '',
    currentWeibo: '',
    currentOfficialAccount: '',
    currentSeo: '',
    keywords: [],
  }),
}));
