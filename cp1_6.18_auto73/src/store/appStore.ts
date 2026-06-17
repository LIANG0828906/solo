import { create } from 'zustand';
import type { Card, Relation } from '@/shared/cardTypes';
import * as api from '@/api/mockApi';

interface AppState {
  cards: Card[];
  relations: Relation[];
  searchQuery: string;
  selectedTags: string[];
  isEditorOpen: boolean;
  editingCard: Card | null;
  newlyCreatedCardId: string | null;
  isLoading: boolean;

  loadData: () => Promise<void>;
  openEditor: (card?: Card) => void;
  closeEditor: () => void;
  saveCard: (data: Omit<Card, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  addRelation: (sourceId: string, targetId: string) => Promise<void>;
  removeRelation: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
  clearNewlyCreatedCardId: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  cards: [],
  relations: [],
  searchQuery: '',
  selectedTags: [],
  isEditorOpen: false,
  editingCard: null,
  newlyCreatedCardId: null,
  isLoading: true,

  loadData: async () => {
    const [cards, relations] = await Promise.all([
      api.fetchCards(),
      api.fetchRelations(),
    ]);
    set({ cards, relations, isLoading: false });
  },

  openEditor: (card) => {
    set({ isEditorOpen: true, editingCard: card || null });
  },

  closeEditor: () => {
    set({ isEditorOpen: false, editingCard: null });
  },

  saveCard: async (data, id) => {
    if (id) {
      const updated = await api.updateCard(id, data);
      set(state => ({
        cards: state.cards.map(c => c.id === id ? updated : c),
      }));
    } else {
      const card = await api.createCard(data);
      set(state => ({
        cards: [card, ...state.cards],
        newlyCreatedCardId: card.id,
      }));
      setTimeout(() => {
        const current = get().newlyCreatedCardId;
        if (current === card.id) {
          set({ newlyCreatedCardId: null });
        }
      }, 2000);
    }
    set({ isEditorOpen: false, editingCard: null });
  },

  removeCard: async (id) => {
    await api.deleteCard(id);
    set(state => ({
      cards: state.cards.filter(c => c.id !== id),
      relations: state.relations.filter(r => r.sourceId !== id && r.targetId !== id),
    }));
  },

  addRelation: async (sourceId, targetId) => {
    const relation = await api.createRelation(sourceId, targetId);
    set(state => ({
      relations: [...state.relations, relation],
    }));
  },

  removeRelation: async (id) => {
    await api.deleteRelation(id);
    set(state => ({
      relations: state.relations.filter(r => r.id !== id),
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  toggleTag: (tag) => {
    set(state => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter(t => t !== tag)
        : [...state.selectedTags, tag],
    }));
  },

  clearNewlyCreatedCardId: () => {
    set({ newlyCreatedCardId: null });
  },
}));
