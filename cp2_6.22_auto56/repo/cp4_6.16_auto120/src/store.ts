import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import type { Card, Folder, StoreState, ContentType, CanvasTransform } from './utils/types';
import { calculateAllSimilarities } from './utils/similarity';

const COLORS = [
  '#ff8c42',
  '#4a90d9',
  '#e8a0bf',
  '#7ed6a0',
  '#c5b4e3',
  '#f7dc6f',
  '#f1948a',
  '#85c1e9',
];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function generateColorFromContent(content: string, contentType: string): string {
  if (contentType === 'image') {
    return '#7ed6a0';
  }
  if (contentType === 'drawing') {
    return '#c5b4e3';
  }
  
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = content.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

const defaultFolders: Folder[] = [
  {
    id: 'default',
    name: '所有灵感',
    color: '#ff8c42',
    createdAt: new Date().toISOString(),
  },
];

const defaultCards: Card[] = [];

const defaultTransform: CanvasTransform = {
  x: 0,
  y: 0,
  scale: 1,
};

export const useStore = create<StoreState & {
  addCard: (content: string, contentType: ContentType) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (id: string, x: number, y: number) => void;
  selectCard: (id: string | null) => void;
  setEditingCard: (id: string | null) => void;
  toggleKnowledgeNetwork: () => void;
  setCanvasTransform: (transform: CanvasTransform) => void;
  setShowCreateModal: (show: boolean) => void;
  setActiveTab: (tab: ContentType) => void;
  setSidebarOpen: (open: boolean) => void;
  getSimilarityPairs: () => { cardId1: string; cardId2: string; similarity: number }[];
  addFolder: (name: string) => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  markCardAsNotNew: (id: string) => void;
}>((set, get) => ({
  cards: defaultCards,
  folders: defaultFolders,
  selectedCardId: null,
  editingCardId: null,
  showKnowledgeNetwork: false,
  canvasTransform: defaultTransform,
  showCreateModal: false,
  activeTab: 'text',
  sidebarOpen: true,

  addCard: (content: string, contentType: ContentType) => {
    const { canvasTransform } = get();
    const cardWidth = contentType === 'image' ? 280 : 260;
    const cardHeight = contentType === 'text' ? 180 : 220;
    
    const centerX = -canvasTransform.x / canvasTransform.scale + (window.innerWidth - 280) / 2 / canvasTransform.scale - cardWidth / 2;
    const centerY = -canvasTransform.y / canvasTransform.scale + window.innerHeight / 2 / canvasTransform.scale - cardHeight / 2;
    
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 60;
    
    const newCard: Card = {
      id: uuidv4(),
      content,
      contentType,
      x: centerX + offsetX,
      y: centerY + offsetY,
      width: cardWidth,
      height: cardHeight,
      folderId: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: generateColorFromContent(content, contentType),
      isNew: true,
    };
    
    set(state => ({
      cards: [...state.cards, newCard],
      showCreateModal: false,
    }));
    
    get().saveToStorage();
  },

  updateCard: (id: string, updates: Partial<Card>) => {
    set(state => ({
      cards: state.cards.map(card =>
        card.id === id
          ? { ...card, ...updates, updatedAt: new Date().toISOString() }
          : card
      ),
    }));
    get().saveToStorage();
  },

  deleteCard: (id: string) => {
    set(state => ({
      cards: state.cards.filter(card => card.id !== id),
      selectedCardId: state.selectedCardId === id ? null : state.selectedCardId,
      editingCardId: state.editingCardId === id ? null : state.editingCardId,
    }));
    get().saveToStorage();
  },

  moveCard: (id: string, x: number, y: number) => {
    set(state => ({
      cards: state.cards.map(card =>
        card.id === id ? { ...card, x, y } : card
      ),
    }));
  },

  selectCard: (id: string | null) => {
    set({ selectedCardId: id });
  },

  setEditingCard: (id: string | null) => {
    set({ editingCardId: id });
  },

  toggleKnowledgeNetwork: () => {
    set(state => ({ showKnowledgeNetwork: !state.showKnowledgeNetwork }));
  },

  setCanvasTransform: (transform: CanvasTransform) => {
    set({ canvasTransform: transform });
  },

  setShowCreateModal: (show: boolean) => {
    set({ showCreateModal: show });
  },

  setActiveTab: (tab: ContentType) => {
    set({ activeTab: tab });
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  getSimilarityPairs: () => {
    const { cards } = get();
    return calculateAllSimilarities(cards);
  },

  addFolder: (name: string) => {
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      color: getRandomColor(),
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      folders: [...state.folders, newFolder],
    }));
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const storedCards = await get('memomosaic_cards');
      const storedFolders = await get('memomosaic_folders');
      if (Array.isArray(storedCards)) {
        set({ cards: storedCards.map((c: Card) => ({ ...c, isNew: false })) });
      }
      if (Array.isArray(storedFolders)) {
        set({ folders: storedFolders });
      }
    } catch (e) {
      console.error('Failed to load from IndexedDB:', e);
    }
  },

  saveToStorage: async () => {
    try {
      const { cards, folders } = get();
      await set('memomosaic_cards', cards);
      await set('memomosaic_folders', folders);
    } catch (e) {
      console.error('Failed to save to IndexedDB:', e);
    }
  },

  markCardAsNotNew: (id: string) => {
    set(state => ({
      cards: state.cards.map(card =>
        card.id === id ? { ...card, isNew: false } : card
      ),
    }));
  },
}));
