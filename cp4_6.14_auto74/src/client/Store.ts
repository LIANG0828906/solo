import { create } from 'zustand';
import axios from 'axios';

const API = '/api';

export interface CardData {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
}

export interface ConnectionData {
  id: string;
  fromCardId: string;
  toCardId: string;
  label: string;
  color: string;
}

export type ToolMode = 'select' | 'add-card' | 'connect' | 'delete';

interface BoardStore {
  cards: CardData[];
  connections: ConnectionData[];
  selectedCardId: string | null;
  toolMode: ToolMode;
  connectingFrom: string | null;
  connectingTo: { x: number; y: number } | null;
  onlineCount: number;

  setToolMode: (mode: ToolMode) => void;
  setConnectingFrom: (cardId: string | null) => void;
  setConnectingTo: (pos: { x: number; y: number } | null) => void;
  selectCard: (id: string | null) => void;

  loadBoard: () => Promise<void>;
  addCard: (x: number, y: number) => Promise<void>;
  updateCard: (id: string, updates: Partial<CardData>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  addConnection: (fromCardId: string, toCardId: string, label?: string) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  saveSnapshot: () => Promise<void>;

  applyFullSync: (state: { cards: CardData[]; connections: ConnectionData[] }) => void;
  applyIncremental: (updates: any[]) => void;
  setOnlineCount: (count: number) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  cards: [],
  connections: [],
  selectedCardId: null,
  toolMode: 'select',
  connectingFrom: null,
  connectingTo: null,
  onlineCount: 1,

  setToolMode: (mode) => set({ toolMode: mode, connectingFrom: null, connectingTo: null }),
  setConnectingFrom: (cardId) => set({ connectingFrom: cardId }),
  setConnectingTo: (pos) => set({ connectingTo: pos }),
  selectCard: (id) => set({ selectedCardId: id }),

  loadBoard: async () => {
    const res = await axios.get(`${API}/board`);
    set({ cards: res.data.cards, connections: res.data.connections });
  },

  addCard: async (x, y) => {
    const COLORS = ['#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5'];
    const AVATARS = ['🧑‍💻', '👩‍🎨', '🧑‍🔧', '👩‍💼'];
    const NAMES = ['小明', '小红', '小华', '小丽'];
    const idx = Math.floor(Math.random() * 4);
    const res = await axios.post(`${API}/card`, {
      x,
      y,
      content: '',
      color: COLORS[idx],
      authorName: NAMES[idx],
      authorAvatar: AVATARS[idx],
    });
  },

  updateCard: async (id, updates) => {
    await axios.put(`${API}/card/${id}`, updates);
  },

  deleteCard: async (id) => {
    await axios.delete(`${API}/card/${id}`);
    const { selectedCardId } = get();
    if (selectedCardId === id) set({ selectedCardId: null });
  },

  addConnection: async (fromCardId, toCardId, label) => {
    await axios.post(`${API}/connection`, { fromCardId, toCardId, label: label ?? '' });
    set({ connectingFrom: null, connectingTo: null });
  },

  deleteConnection: async (id) => {
    await axios.delete(`${API}/connection/${id}`);
  },

  saveSnapshot: async () => {
    await axios.post(`${API}/snapshot`);
  },

  applyFullSync: (state) => {
    set({ cards: state.cards, connections: state.connections });
  },

  applyIncremental: (updates) => {
    const state = get();
    let newCards = [...state.cards];
    let newConnections = [...state.connections];

    for (const update of updates) {
      switch (update.action) {
        case 'add-card':
          if (!newCards.find((c) => c.id === update.card.id)) {
            newCards.push(update.card);
          }
          break;
        case 'update-card':
          newCards = newCards.map((c) => (c.id === update.card.id ? update.card : c));
          break;
        case 'delete-card':
          newCards = newCards.filter((c) => c.id !== update.cardId);
          newConnections = newConnections.filter(
            (c) => !update.connectionIds?.includes(c.id)
          );
          break;
        case 'add-connection':
          if (!newConnections.find((c) => c.id === update.connection.id)) {
            newConnections.push(update.connection);
          }
          break;
        case 'delete-connection':
          newConnections = newConnections.filter((c) => c.id !== update.connectionId);
          break;
        case 'full-sync':
          newCards = update.state.cards;
          newConnections = update.state.connections;
          break;
      }
    }

    set({ cards: newCards, connections: newConnections });
  },

  setOnlineCount: (count) => set({ onlineCount: count }),
}));
