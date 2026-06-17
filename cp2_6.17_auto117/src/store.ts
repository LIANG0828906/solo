import { create } from 'zustand';
import {
  Card,
  CardType,
  TagNode,
  SearchFilters,
  loadCards,
  loadTags,
  createCard as dataCreateCard,
  updateCard as dataUpdateCard,
  deleteCard as dataDeleteCard,
  searchCards as dataSearchCards,
  addTag as dataAddTag,
  deleteTag as dataDeleteTag,
  addTagToCard as dataAddTagToCard,
  removeTagFromCard as dataRemoveTagFromCard,
  exportCards as dataExportCards,
  importCards as dataImportCards,
  ImportResult,
  ensureIndexBuilt,
} from './modules/data';

interface KBState {
  cards: Card[];
  tags: TagNode[];
  filteredCards: Card[];
  totalCount: number;
  resultCount: number;
  selectedCardIds: Set<string>;
  expandedTagIds: Set<string>;
  filters: SearchFilters;
  isLoading: boolean;
  editingCard: Card | null;
  showEditor: boolean;
  showFilterPanel: boolean;

  initData: () => void;
  setFilters: (partial: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  toggleTagSelection: (tagId: string) => void;
  clearTagSelection: () => void;
  toggleTagExpand: (tagId: string) => void;
  performSearch: () => void;

  openCreateEditor: () => void;
  openEditEditor: (card: Card) => void;
  closeEditor: () => void;
  saveCard: (data: Partial<Card> & { title: string; content: string }) => void;
  removeCard: (id: string) => void;
  addCardTag: (cardId: string, tagId: string) => void;
  removeCardTag: (cardId: string, tagId: string) => void;

  addNewTag: (parentId: string | null, name: string) => void;
  removeTag: (tagId: string) => void;

  toggleCardSelection: (cardId: string) => void;
  selectAllCards: () => void;
  clearCardSelection: () => void;

  setShowFilterPanel: (show: boolean) => void;

  doExport: () => string;
  doImport: (json: string, onDuplicate?: (card: Card) => 'overwrite' | 'skip') => ImportResult;
}

export const useKBStore = create<KBState>((set, get) => ({
  cards: [],
  tags: [],
  filteredCards: [],
  totalCount: 0,
  resultCount: 0,
  selectedCardIds: new Set(),
  expandedTagIds: new Set(),
  filters: {
    keyword: '',
    tags: [],
    type: 'all',
  },
  isLoading: true,
  editingCard: null,
  showEditor: false,
  showFilterPanel: false,

  initData: () => {
    const cards = loadCards();
    const tags = loadTags();
    ensureIndexBuilt();
    const allDefaultExpanded = new Set<string>();
    tags.forEach((t) => {
      allDefaultExpanded.add(t.id);
      t.children.forEach((c) => allDefaultExpanded.add(c.id));
    });
    set({
      cards,
      tags,
      filteredCards: cards,
      totalCount: cards.length,
      resultCount: cards.length,
      expandedTagIds: allDefaultExpanded,
      isLoading: false,
    });
  },

  setFilters: (partial) => {
    const current = get().filters;
    const next = { ...current, ...partial };
    set({ filters: next });
    const results = dataSearchCards(next);
    set({ filteredCards: results, resultCount: results.length });
  },

  resetFilters: () => {
    const reset: SearchFilters = { keyword: '', tags: [], type: 'all' };
    set({ filters: reset });
    const cards = get().cards;
    set({ filteredCards: cards, resultCount: cards.length });
  },

  toggleTagSelection: (tagId) => {
    const current = get().filters.tags;
    const exists = current.includes(tagId);
    const nextTags = exists ? current.filter((t) => t !== tagId) : [...current, tagId];
    get().setFilters({ tags: nextTags });
  },

  clearTagSelection: () => {
    get().setFilters({ tags: [] });
  },

  toggleTagExpand: (tagId) => {
    const cur = new Set(get().expandedTagIds);
    if (cur.has(tagId)) cur.delete(tagId);
    else cur.add(tagId);
    set({ expandedTagIds: cur });
  },

  performSearch: () => {
    const filters = get().filters;
    const results = dataSearchCards(filters);
    set({ filteredCards: results, resultCount: results.length });
  },

  openCreateEditor: () => {
    set({
      editingCard: null,
      showEditor: true,
    });
  },

  openEditEditor: (card) => {
    set({
      editingCard: card,
      showEditor: true,
    });
  },

  closeEditor: () => {
    set({ showEditor: false, editingCard: null });
  },

  saveCard: (data) => {
    const editing = get().editingCard;
    let card: Card | null;
    if (editing) {
      card = dataUpdateCard(editing.id, data);
    } else {
      card = dataCreateCard(data);
    }
    if (card) {
      const allCards = loadCards();
      set({ cards: allCards, totalCount: allCards.length });
      get().performSearch();
    }
    set({ showEditor: false, editingCard: null });
  },

  removeCard: (id) => {
    const ok = dataDeleteCard(id);
    if (ok) {
      const allCards = loadCards();
      const selected = new Set(get().selectedCardIds);
      selected.delete(id);
      set({
        cards: allCards,
        totalCount: allCards.length,
        selectedCardIds: selected,
      });
      get().performSearch();
    }
  },

  addCardTag: (cardId, tagId) => {
    dataAddTagToCard(cardId, tagId);
    const allCards = loadCards();
    set({ cards: allCards });
    get().performSearch();
  },

  removeCardTag: (cardId, tagId) => {
    dataRemoveTagFromCard(cardId, tagId);
    const allCards = loadCards();
    set({ cards: allCards });
    get().performSearch();
  },

  addNewTag: (parentId, name) => {
    const newTags = dataAddTag(parentId, name);
    set({ tags: newTags });
  },

  removeTag: (tagId) => {
    const newTags = dataDeleteTag(tagId);
    const allCards = loadCards();
    const curFilters = get().filters;
    if (curFilters.tags.includes(tagId)) {
      curFilters.tags = curFilters.tags.filter((t) => t !== tagId);
    }
    set({ tags: newTags, cards: allCards, totalCount: allCards.length });
    get().performSearch();
  },

  toggleCardSelection: (cardId) => {
    const cur = new Set(get().selectedCardIds);
    if (cur.has(cardId)) cur.delete(cardId);
    else cur.add(cardId);
    set({ selectedCardIds: cur });
  },

  selectAllCards: () => {
    const ids = get().filteredCards.map((c) => c.id);
    set({ selectedCardIds: new Set(ids) });
  },

  clearCardSelection: () => {
    set({ selectedCardIds: new Set() });
  },

  setShowFilterPanel: (show) => {
    set({ showFilterPanel: show });
  },

  doExport: () => {
    const ids = Array.from(get().selectedCardIds);
    return dataExportCards(ids);
  },

  doImport: (json, onDuplicate) => {
    const result = dataImportCards(json, onDuplicate);
    const allCards = loadCards();
    const allTags = loadTags();
    set({ cards: allCards, tags: allTags, totalCount: allCards.length });
    get().performSearch();
    return result;
  },
}));
