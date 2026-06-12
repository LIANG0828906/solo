import { create } from 'zustand';
import axios from 'axios';
import type {
  User,
  Poem,
  PoemListItem,
  Comment,
  Version,
  UserComment,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

interface StoreState {
  currentUser: User | null;
  poems: PoemListItem[];
  currentPoem: Poem | null;
  comments: Comment[];
  versions: Version[];
  myPoems: PoemListItem[];
  myComments: UserComment[];
  isLoading: Record<string, boolean>;
  selectedVersionId: string | null;
  viewLines: string[] | null;

  setCurrentUser: (user: User) => void;
  fetchCurrentUser: () => Promise<void>;
  fetchPoems: () => Promise<void>;
  fetchPoem: (id: string) => Promise<void>;
  fetchComments: (poemId: string) => Promise<void>;
  fetchVersions: (poemId: string) => Promise<void>;
  updatePoemLines: (
    poemId: string,
    lines: string[],
    user: User
  ) => Promise<boolean>;
  addComment: (
    poemId: string,
    data: {
      content: string;
      authorId: string;
      authorName: string;
      lineIndex?: number | null;
      parentId?: string | null;
    }
  ) => Promise<Comment | null>;
  fetchMyPoems: (userId: string) => Promise<void>;
  fetchMyComments: (userId: string) => Promise<void>;
  setSelectedVersion: (versionId: string | null) => void;
  setViewLines: (lines: string[] | null) => void;
  clearCurrentPoem: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  currentUser: null,
  poems: [],
  currentPoem: null,
  comments: [],
  versions: [],
  myPoems: [],
  myComments: [],
  isLoading: {},
  selectedVersionId: null,
  viewLines: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  fetchCurrentUser: async () => {
    try {
      const { data } = await api.get<User>('/users/current');
      set({ currentUser: data });
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  },

  fetchPoems: async () => {
    set((s) => ({ isLoading: { ...s.isLoading, poems: true } }));
    try {
      const { data } = await api.get<PoemListItem[]>('/poems');
      set({ poems: data });
    } catch (err) {
      console.error('Failed to fetch poems:', err);
    } finally {
      set((s) => ({ isLoading: { ...s.isLoading, poems: false } }));
    }
  },

  fetchPoem: async (id) => {
    set((s) => ({ isLoading: { ...s.isLoading, poem: true } }));
    try {
      const { data } = await api.get<Poem>(`/poems/${id}`);
      set({ currentPoem: data, viewLines: null, selectedVersionId: null });
    } catch (err) {
      console.error('Failed to fetch poem:', err);
    } finally {
      set((s) => ({ isLoading: { ...s.isLoading, poem: false } }));
    }
  },

  fetchComments: async (poemId) => {
    try {
      const { data } = await api.get<Comment[]>(`/poems/${poemId}/comments`);
      set({ comments: data });
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  },

  fetchVersions: async (poemId) => {
    try {
      const { data } = await api.get<Version[]>(`/poems/${poemId}/versions`);
      set({ versions: data });
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    }
  },

  updatePoemLines: async (poemId, lines, user) => {
    try {
      const { data } = await api.put(`/poems/${poemId}`, {
        lines,
        editorId: user.id,
        editorName: user.nickname,
      });
      set({
        currentPoem: data.poem,
        versions: (prev) => {
          const without = prev.filter((v) => v.id !== data.newVersion.id);
          return [data.newVersion, ...without].sort(
            (a, b) => b.versionNumber - a.versionNumber
          );
        },
        viewLines: null,
        selectedVersionId: null,
      });
      return true;
    } catch (err) {
      console.error('Failed to update poem:', err);
      return false;
    }
  },

  addComment: async (poemId, payload) => {
    try {
      const { data } = await api.post<Comment>(`/poems/${poemId}/comments`, payload);
      set((state) => {
        const newList = [data, ...state.comments].sort(
          (a, b) => b.createdAt - a.createdAt
        );
        return { comments: newList };
      });
      return data;
    } catch (err) {
      console.error('Failed to add comment:', err);
      return null;
    }
  },

  fetchMyPoems: async (userId) => {
    set((s) => ({ isLoading: { ...s.isLoading, myPoems: true } }));
    try {
      const { data } = await api.get<PoemListItem[]>(`/poems/user/${userId}`);
      set({ myPoems: data });
    } catch (err) {
      console.error('Failed to fetch my poems:', err);
    } finally {
      set((s) => ({ isLoading: { ...s.isLoading, myPoems: false } }));
    }
