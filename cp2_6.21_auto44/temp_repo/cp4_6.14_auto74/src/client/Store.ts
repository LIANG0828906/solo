import { create } from 'zustand';
import axios from 'axios';
import { shallow } from 'zustand/shallow';

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

export interface SnapshotData {
  id: string;
  timestamp: number;
  cards: CardData[];
  connections: ConnectionData[];
}

export type ToolMode = 'select' | 'add-card' | 'connect' | 'delete';

interface BoardStore {
  cards: CardData[];
  connections: ConnectionData[];
  selectedCardId: string | null;
  toolMode: ToolMode;
  connectingFrom: string | null;
  connectingTo: { x: number; y: number } | null;
  hoveredConnectionId: string | null;
  onlineCount: number;
  snapshots: SnapshotData[];
  snapshotPanelOpen: boolean;
  pendingCardUpdates: Map<string, Partial<CardData>>;

  setToolMode: (mode: ToolMode) => void;
  setConnectingFrom: (cardId: string | null) => void;
  setConnectingTo: (pos: { x: number; y: number } | null) => void;
  setHoveredConnectionId: (id: string | null) => void;
  selectCard: (id: string | null) => void;
  setSnapshotPanelOpen: (open: boolean) => void;

  loadBoard: () => Promise<void>;
  addCard: (x: number, y: number) => Promise<void>;
  updateCardLocal: (id: string, updates: Partial<CardData>) => void;
  updateCard: (id: string, updates: Partial<CardData>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  addConnection: (fromCardId: string, toCardId: string, label?: string) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  saveSnapshot: () => Promise<void>;
  loadSnapshots: () => Promise<void>;
  restoreSnapshot: (id: string) => Promise<void>;
  flushPendingCardUpdates: () => void;

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
  hoveredConnectionId: null,
  onlineCount: 1,
  snapshots: [],
  snapshotPanelOpen: false,
  pendingCardUpdates: new Map(),

  setToolMode: (mode) => set({ toolMode: mode, connectingFrom: null, connectingTo: null }),
  setConnectingFrom: (cardId) => set({ connectingFrom: cardId }),
  setConnectingTo: (pos) => set({ connectingTo: pos }),
  setHoveredConnectionId: (id) => set({ hoveredConnectionId: id }),
  selectCard: (id) => set({ selectedCardId: id }),
  setSnapshotPanelOpen: (open) => set({ snapshotPanelOpen: open }),

  loadBoard: async () => {
    const res = await axios.get(`${API}/board`);
    set({ cards: res.data.cards, connections: res.data.connections });
  },

  addCard: async (x, y) => {
    const COLORS = ['#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5'];
    const AVATARS = ['🧑‍💻', '👩‍🎨', '🧑‍🔧', '👩‍💼', '🧑‍🎨', '👩‍💻', '🧑‍🔬', '👩‍🏫'];
    const NAMES = ['小明', '小红', '小华', '小丽', '小强', '小美', '小刚', '小芳'];
    const idx = Math.floor(Math.random() * 8);
    await axios.post(`${API}/card`, {
      x,
      y,
      content: '',
      color: COLORS[idx % 4],
      authorName: NAMES[idx],
      authorAvatar: AVATARS[idx],
    });
  },

  updateCardLocal: (id, updates) => {
    set((state) => {
      const newCards = state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const pending = new Map(state.pendingCardUpdates);
      const existing = pending.get(id) || {};
      pending.set(id, { ...existing, ...updates });
      return { cards: newCards, pendingCardUpdates: pending };
    });
  },

  updateCard: async (id, updates) => {
    set((state) => {
      const newCards = state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c));
      return { cards: newCards };
    });
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
    await get().loadSnapshots();
  },

  loadSnapshots: async () => {
    const res = await axios.get(`${API}/snapshots`);
    set({ snapshots: res.data });
  },

  restoreSnapshot: async (id) => {
    await axios.post(`${API}/snapshot/${id}/restore`);
    set({ snapshotPanelOpen: false });
  },

  flushPendingCardUpdates: async () => {
    const pending = get().pendingCardUpdates;
    if (pending.size === 0) return;
    const entries = Array.from(pending.entries());
    set({ pendingCardUpdates: new Map() });
    for (const [id, updates] of entries) {
      try {
        await axios.put(`${API}/card/${id}`, updates);
      } catch {}
    }
  },

  applyFullSync: (state) => {
    set({ cards: state.cards, connections: state.connections });
  },

  applyIncremental: (updates) => {
    const state = get();
    let newCards = state.cards;
    let newConnections = state.connections;
    let changed = false;

    for (const update of updates) {
      switch (update.action) {
        case 'add-card':
          if (!newCards.find((c) => c.id === update.card.id)) {
            newCards = [...newCards, update.card];
            changed = true;
          }
          break;
        case 'update-card': {
          const idx = newCards.findIndex((c) => c.id === update.card.id);
          if (idx !== -1 && shallow(newCards[idx], update.card)) {
            newCards = newCards.map((c) => (c.id === update.card.id ? update.card : c));
            changed = true;
          } else if (idx === -1) {
            newCards = [...newCards, update.card];
            changed = true;
          }
          break;
        }
        case 'delete-card':
          newCards = newCards.filter((c) => c.id !== update.cardId);
          newConnections = newConnections.filter(
            (c) => !update.connectionIds?.includes(c.id)
          );
          changed = true;
          break;
        case 'add-connection':
          if (!newConnections.find((c) => c.id === update.connection.id)) {
            newConnections = [...newConnections, update.connection];
            changed = true;
          }
          break;
        case 'delete-connection':
          newConnections = newConnections.filter((c) => c.id !== update.connectionId);
          changed = true;
          break;
        case 'full-sync':
          newCards = update.state.cards;
          newConnections = update.state.connections;
          changed = true;
          break;
      }
    }

    if (changed) {
      set({ cards: newCards, connections: newConnections });
    }
  },

  setOnlineCount: (count) => set({ onlineCount: count }),
}));
