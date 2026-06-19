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
  currentUser: User;
  availableUsers: User[];
  setParagraphs: (ps: ParagraphItem[], meta?: DocumentMeta) => void;
  setTranslation: (id: string, value: string) => void;
  markSaving: (id: string) => void;
  markSaved: (id: string) => void;
  markError: (id: string) => void;
  addComment: (paragraphId: string, comment: Comment) => void;
  setLoading: (v: boolean) => void;
  setCurrentUser: (user: User) => void;
  updateCurrentUserAvatar: (avatarUrl: string) => void;
}

const defaultUsers: User[] = [
  { id: 'u_001', name: '李译者', initials: 'LZ', color: '#8b6914' },
  { id: 'u_002', name: '王审校', initials: 'WS', color: '#5a3e2b' },
  { id: 'u_003', name: '张编辑', initials: 'ZB', color: '#2e7d32' },
  { id: 'u_004', name: '陈产品', initials: 'CP', color: '#1565c0' },
  { id: 'u_005', name: 'Alex Chen', initials: 'AC', color: '#6a1b9a' },
];

export const useDocumentStore = create<DocumentState>((set) => ({
  paragraphs: [],
  translations: {},
  comments: {},
  meta: null,
  isLoading: false,
  saveStatuses: {},
  currentUser: defaultUsers[0],
  availableUsers: defaultUsers,
  setParagraphs: (ps, meta) =>
    set({
      paragraphs: ps,
      translations: {},
      comments: {},
      meta: meta || null,
      saveStatuses: {},
    }),
  setTranslation: (id, value) =>
    set((state) => ({
      translations: { ...state.translations, [id]: value },
    })),
  markSaving: (id) =>
    set((state) => ({
      saveStatuses: {
        ...state.saveStatuses,
        [id]: { status: 'saving', timestamp: new Date().toISOString() },
      },
    })),
  markSaved: (id) =>
    set((state) => ({
      saveStatuses: {
        ...state.saveStatuses,
        [id]: { status: 'saved', timestamp: new Date().toISOString() },
      },
    })),
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
  setCurrentUser: (user) => set({ currentUser: user }),
  updateCurrentUserAvatar: (avatarUrl) =>
    set((state) => ({
      currentUser: { ...state.currentUser, avatarUrl },
    })),
}));
