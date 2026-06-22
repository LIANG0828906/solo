import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  initials: string;
  color: string;
  avatarUrl?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  avatarColor: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface ParagraphItem {
  id: string;
  text: string;
}

export interface DocumentMeta {
  fileName: string;
  uploadedAt: string;
  fileSize: number;
}

export interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  timestamp?: string;
}

export interface DocumentState {
  paragraphs: ParagraphItem[];
  translations: Record<string, string>;
  comments: Record<string, Comment[]>;
  meta: DocumentMeta | null;
  isLoading: boolean;
  saveStatuses: Record<string, SaveStatus>;
  saveGenerations: Record<string, number>;
  currentUser: User;
  availableUsers: User[];
  setParagraphs: (ps: ParagraphItem[], meta?: DocumentMeta) => void;
  setTranslation: (id: string, value: string) => void;
  markSaving: (id: string) => number;
  markSaved: (id: string) => void;
  markSavedWithGeneration: (id: string, generation: number) => void;
  markError: (id: string) => void;
  addComment: (paragraphId: string, comment: Comment) => void;
  setLoading: (v: boolean) => void;
  setCurrentUser: (user: User) => void;
  updateCurrentUserAvatar: (avatarUrl: string) => void;
  updateCurrentUserColor: (color: string) => void;
}

const STORAGE_KEY = 'translate_app_user_state';

const defaultUsers: User[] = [
  { id: 'u_001', name: '李译者', initials: 'LZ', color: '#8b6914' },
  { id: 'u_002', name: '王审校', initials: 'WS', color: '#5a3e2b' },
  { id: 'u_003', name: '张编辑', initials: 'ZB', color: '#2e7d32' },
  { id: 'u_004', name: '陈产品', initials: 'CP', color: '#1565c0' },
  { id: 'u_005', name: 'Alex Chen', initials: 'AC', color: '#6a1b9a' },
];

interface PersistedUserState {
  currentUserId: string;
  users: Record<string, { color?: string; avatarUrl?: string }>;
}

function loadUserState(): { currentUser: User; availableUsers: User[] } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { currentUser: defaultUsers[0], availableUsers: defaultUsers };
    }
    const parsed: PersistedUserState = JSON.parse(stored);
    const availableUsers = defaultUsers.map((u) => {
      const custom = parsed.users[u.id];
      if (custom) {
        return { ...u, ...custom };
      }
      return u;
    });
    const currentUser =
      availableUsers.find((u) => u.id === parsed.currentUserId) || availableUsers[0];
    return { currentUser, availableUsers };
  } catch {
    return { currentUser: defaultUsers[0], availableUsers: defaultUsers };
  }
}

function saveUserState(currentUser: User, availableUsers: User[]) {
  try {
    const state: PersistedUserState = {
      currentUserId: currentUser.id,
      users: {},
    };
    availableUsers.forEach((u) => {
      const defaultUser = defaultUsers.find((d) => d.id === u.id);
      if (defaultUser) {
        const hasCustomColor = u.color !== defaultUser.color;
        const hasCustomAvatar = u.avatarUrl !== undefined;
        if (hasCustomColor || hasCustomAvatar) {
          state.users[u.id] = {};
          if (hasCustomColor) state.users[u.id].color = u.color;
          if (hasCustomAvatar) state.users[u.id].avatarUrl = u.avatarUrl;
        }
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const initialUserState = loadUserState();

export const useDocumentStore = create<DocumentState>((set, get) => ({
  paragraphs: [],
  translations: {},
  comments: {},
  meta: null,
  isLoading: false,
  saveStatuses: {},
  saveGenerations: {},
  currentUser: initialUserState.currentUser,
  availableUsers: initialUserState.availableUsers,
  setParagraphs: (ps, meta) =>
    set({
      paragraphs: ps,
      translations: {},
      comments: {},
      meta: meta || null,
      saveStatuses: {},
      saveGenerations: {},
    }),
  setTranslation: (id, value) =>
    set((state) => ({
      translations: { ...state.translations, [id]: value },
    })),
  markSaving: (id) => {
    let nextGen = 1;
    set((state) => {
      const currentGen = state.saveGenerations[id] || 0;
      nextGen = currentGen + 1;
      return {
        saveStatuses: {
          ...state.saveStatuses,
          [id]: { status: 'saving', timestamp: new Date().toISOString() },
        },
        saveGenerations: {
          ...state.saveGenerations,
          [id]: nextGen,
        },
      };
    });
    return nextGen;
  },
  markSaved: (id) =>
    set((state) => ({
      saveStatuses: {
        ...state.saveStatuses,
        [id]: { status: 'saved', timestamp: new Date().toISOString() },
      },
    })),
  markSavedWithGeneration: (id, generation) =>
    set((state) => {
      const currentGen = state.saveGenerations[id] || 0;
      if (generation !== currentGen) {
        return {};
      }
      return {
        saveStatuses: {
          ...state.saveStatuses,
          [id]: { status: 'saved', timestamp: new Date().toISOString() },
        },
      };
    }),
  markError: (id) =>
    set((state) => ({
      saveStatuses: {
        ...state.saveStatuses,
        [id]: { status: 'error', timestamp: new Date().toISOString() },
      },
    })),
  addComment: (paragraphId, comment) =>
    set((state) => {
      const existing = state.comments[paragraphId] || [];
      return {
        comments: {
          ...state.comments,
          [paragraphId]: [...existing, comment],
        },
      };
    }),
  setLoading: (v) => set({ isLoading: v }),
  setCurrentUser: (user) => {
    set({ currentUser: user });
    const state = get();
    saveUserState(state.currentUser, state.availableUsers);
  },
  updateCurrentUserAvatar: (avatarUrl) => {
    set((state) => ({
      currentUser: { ...state.currentUser, avatarUrl },
      availableUsers: state.availableUsers.map((u) =>
        u.id === state.currentUser.id ? { ...u, avatarUrl } : u
      ),
    }));
    const state = get();
    saveUserState(state.currentUser, state.availableUsers);
  },
  updateCurrentUserColor: (color) => {
    set((state) => ({
      currentUser: { ...state.currentUser, color },
      availableUsers: state.availableUsers.map((u) =>
        u.id === state.currentUser.id ? { ...u, color } : u
      ),
    }));
    const state = get();
    saveUserState(state.currentUser, state.availableUsers);
  },
}));
