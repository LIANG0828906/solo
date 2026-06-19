import { create } from 'zustand';
import type { Poem, Annotation, AnnotationReply, InspirationCard, Collection, User, WSMessage, PoemLine, TonalResult, Comment, Collaborator } from './types';

interface AppState {
  currentUser: User;
  poems: Poem[];
  currentPoem: Poem | null;
  annotations: Annotation[];
  inspirationCards: InspirationCard[];
  collections: Collection[];
  collaborators: Collaborator[];
  tonalResults: TonalResult[];
  comments: Comment[];
  wsConnected: boolean;
  activeAnnotationId: string | null;

  setCurrentUser: (user: User) => void;
  setPoems: (poems: Poem[]) => void;
  setCurrentPoem: (poem: Poem | null) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  addAnnotationReply: (annotationId: string, reply: Annotation['replies'][0]) => void;
  setInspirationCards: (cards: InspirationCard[]) => void;
  addInspirationCard: (card: InspirationCard) => void;
  updateInspirationCard: (id: string, updates: Partial<InspirationCard>) => void;
  removeInspirationCard: (id: string) => void;
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  setCollaborators: (collaborators: Collaborator[]) => void;
  setTonalResults: (results: TonalResult[]) => void;
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  setWsConnected: (connected: boolean) => void;
  setActiveAnnotationId: (id: string | null) => void;
  updatePoemLine: (lineId: string, updates: Partial<PoemLine>) => void;
  addPoemLine: (line: PoemLine) => void;
  removePoemLine: (lineId: string) => void;
  handleWSMessage: (msg: WSMessage) => void;
}

const defaultUser: User = {
  id: 'user-1',
  email: 'poet@shiyun.com',
  name: '墨客',
  avatar: '',
};

export const useStore = create<AppState>((set, get) => ({
  currentUser: defaultUser,
  poems: [],
  currentPoem: null,
  annotations: [],
  inspirationCards: [],
  collections: [],
  collaborators: [],
  tonalResults: [],
  comments: [],
  wsConnected: false,
  activeAnnotationId: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setPoems: (poems) => set({ poems }),
  setCurrentPoem: (poem) => set({ currentPoem: poem, annotations: [], tonalResults: [] }),
  setAnnotations: (annotations) => set({ annotations }),
  addAnnotation: (annotation) => set((s) => ({ annotations: [...s.annotations, annotation] })),
  addAnnotationReply: (annotationId, reply) =>
    set((s) => ({
      annotations: s.annotations.map((a) =>
        a.id === annotationId ? { ...a, replies: [...a.replies, reply] } : a
      ),
    })),
  setInspirationCards: (cards) => set({ inspirationCards: cards }),
  addInspirationCard: (card) => set((s) => ({ inspirationCards: [card, ...s.inspirationCards] })),
  updateInspirationCard: (id, updates) =>
    set((s) => ({
      inspirationCards: s.inspirationCards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeInspirationCard: (id) =>
    set((s) => ({ inspirationCards: s.inspirationCards.filter((c) => c.id !== id) })),
  setCollections: (collections) => set({ collections }),
  addCollection: (collection) => set((s) => ({ collections: [...s.collections, collection] })),
  setCollaborators: (collaborators) => set({ collaborators }),
  setTonalResults: (results) => set({ tonalResults: results }),
  setComments: (comments) => set({ comments }),
  addComment: (comment) => set((s) => ({ comments: [...s.comments, comment] })),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setActiveAnnotationId: (id) => set({ activeAnnotationId: id }),
  updatePoemLine: (lineId, updates) =>
    set((s) => {
      if (!s.currentPoem) return s;
      return {
        currentPoem: {
          ...s.currentPoem,
          lines: s.currentPoem.lines.map((l) => (l.id === lineId ? { ...l, ...updates } : l)),
        },
      };
    }),
  addPoemLine: (line) =>
    set((s) => {
      if (!s.currentPoem) return s;
      return {
        currentPoem: {
          ...s.currentPoem,
          lines: [...s.currentPoem.lines, line],
        },
      };
    }),
  removePoemLine: (lineId) =>
    set((s) => {
      if (!s.currentPoem) return s;
      return {
        currentPoem: {
          ...s.currentPoem,
          lines: s.currentPoem.lines.filter((l) => l.id !== lineId),
        },
      };
    }),
  handleWSMessage: (msg) => {
    const state = get();
    switch (msg.type) {
      case 'annotation_added':
        state.addAnnotation(msg.payload as Annotation);
        break;
      case 'annotation_replied': {
        const reply = msg.payload as AnnotationReply;
        const annId = (msg.payload as { annotationId?: string }).annotationId || '';
        state.addAnnotationReply(annId, reply);
        break;
      }
      case 'line_updated': {
        const lineUpdate = msg.payload as { lineId: string; updates: Partial<PoemLine> };
        state.updatePoemLine(lineUpdate.lineId, lineUpdate.updates);
        break;
      }
      case 'collaborator_joined':
      case 'collaborator_left':
        break;
    }
  },
}));
