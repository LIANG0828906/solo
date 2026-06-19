import { create } from 'zustand';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface ParagraphItem {
  id: string;
  text: string;
}

export interface DocumentState {
  paragraphs: ParagraphItem[];
  translations: Record<string, string>;
  comments: Record<string, Comment[]>;
  fileName: string;
  isLoading: boolean;
  setParagraphs: (ps: ParagraphItem[], fileName?: string) => void;
  setTranslation: (id: string, value: string) => void;
  addComment: (paragraphId: string, comment: Comment) => void;
  setLoading: (v: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  paragraphs: [],
  translations: {},
  comments: {},
  fileName: '',
  isLoading: false,
  setParagraphs: (ps, fileName) =>
    set({
      paragraphs: ps,
      translations: {},
      comments: {},
      fileName: fileName || '',
    }),
  setTranslation: (id, value) =>
    set((state) => ({
      translations: { ...state.translations, [id]: value },
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
}));
