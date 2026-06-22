import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import type { Board, Card, Connection, SyncLogEntry, ThemeColor, CardColor } from '../types';
import { MAX_CARDS, MAX_CONNECTIONS } from '../types';

interface BoardState {
  boards: Board[];
  cards: Card[];
  connections: Connection[];
  currentBoardId: string | null;
  syncLogs: SyncLogEntry[];

  loadFromDB: () => Promise<void>;
  setCurrentBoard: (id: string | null) => void;

  addBoard: (name: string, themeColor: ThemeColor) => void;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;

  addCard: (boardId: string, title: string, emoji: string, color: CardColor, x: number, y: number) => string | null;
  updateCardPosition: (id: string, x: number, y: number) => void;
  updateCard: (id: string, updates: Partial<Pick<Card, 'title' | 'emoji' | 'color'>>) => void;
  deleteCard: (id: string) => void;
  copyCard: (id: string) => string | null;
  bringCardToTop: (id: string) => void;

  addConnection: (boardId: string, fromCardId: string, toCardId: string) => string | null;
  deleteConnection: (id: string) => void;

  addSyncLog: (action: string, detail: string, boardId: string) => void;
  loadSyncLogs: () => void;
  clearSyncLogs: () => void;
}

function persistToDB(state: { boards: Board[]; cards: Card[]; connections: Connection[] }) {
  set('idea-canvas-data', state).catch(console.error);
}

function persistSyncLogs(logs: SyncLogEntry[]) {
  try {
    localStorage.setItem('idea-canvas-sync-logs', JSON.stringify(logs));
  } catch {}
}

function loadSyncLogsFromStorage(): SyncLogEntry[] {
  try {
    const raw = localStorage.getItem('idea-canvas-sync-logs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  cards: [],
  connections: [],
  currentBoardId: null,
  syncLogs: [],

  loadFromDB: async () => {
    const data = await get<{ boards: Board[]; cards: Card[]; connections: Connection[] }>('idea-canvas-data');
    if (data) {
      set({ boards: data.boards || [], cards: data.cards || [], connections: data.connections || [] });
    }
    get().loadSyncLogs();
  },

  setCurrentBoard: (id) => {
    set({ currentBoardId: id });
  },

  addBoard: (name, themeColor) => {
    const now = Date.now();
    const board: Board = { id: uuidv4(), name, themeColor, createdAt: now, updatedAt: now };
    set((s) => {
      const boards = [...s.boards, board];
      const newState = { boards, cards: s.cards, connections: s.connections };
      persistToDB(newState);
      return { boards };
    });
    get().addSyncLog('create_board', `创建白板「${name}」`, board.id);
  },

  renameBoard: (id, name) => {
    set((s) => {
      const boards = s.boards.map((b) => (b.id === id ? { ...b, name, updatedAt: Date.now() } : b));
      const newState = { boards, cards: s.cards, connections: s.connections };
      persistToDB(newState);
      return { boards };
    });
    get().addSyncLog('rename_board', `重命名白板为「${name}」`, id);
  },

  deleteBoard: (id) => {
    set((s) => {
      const boards = s.boards.filter((b) => b.id !== id);
      const cards = s.cards.filter((c) => c.boardId !== id);
      const connections = s.connections.filter((c) => c.boardId !== id);
      persistToDB({ boards, cards, connections });
      return { boards, cards, connections, currentBoardId: s.currentBoardId === id ? null : s.currentBoardId };
    });
    get().addSyncLog('delete_board', `删除白板`, id);
  },

  addCard: (boardId, title, emoji, color, x, y) => {
    const state = get();
    const boardCards = state.cards.filter((c) => c.boardId === boardId);
    if (boardCards.length >= MAX_CARDS) {
      alert(`卡片数量已达上限（${MAX_CARDS}张），无法继续添加`);
      return null;
    }
    const now = Date.now();
    const maxZ = boardCards.reduce((max, c) => Math.max(max, c.zIndex), 0);
    const card: Card = { id: uuidv4(), boardId, title, emoji, color, x, y, zIndex: maxZ + 1, createdAt: now, updatedAt: now };
    set((s) => {
      const cards = [...s.cards, card];
      const newState = { boards: s.boards, cards, connections: s.connections };
      persistToDB(newState);
      return { cards };
    });
    get().addSyncLog('add_card', `添加卡片「${title}」`, boardId);
    return card.id;
  },

  updateCardPosition: (id, x, y) => {
    set((s) => {
      const cards = s.cards.map((c) => (c.id === id ? { ...c, x, y, updatedAt: Date.now() } : c));
      const newState = { boards: s.boards, cards, connections: s.connections };
      persistToDB(newState);
      return { cards };
    });
  },

  updateCard: (id, updates) => {
    set((s) => {
      const cards = s.cards.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c));
      const newState = { boards: s.boards, cards, connections: s.connections };
      persistToDB(newState);
      return { cards };
    });
    get().addSyncLog('edit_card', `编辑卡片`, get().cards.find((c) => c.id === id)?.boardId || '');
  },

  deleteCard: (id) => {
    const card = get().cards.find((c) => c.id === id);
    set((s) => {
      const cards = s.cards.filter((c) => c.id !== id);
      const connections = s.connections.filter((c) => c.fromCardId !== id && c.toCardId !== id);
      persistToDB({ boards: s.boards, cards, connections });
      return { cards, connections };
    });
    if (card) {
      get().addSyncLog('delete_card', `删除卡片「${card.title}」`, card.boardId);
    }
  },

  copyCard: (id) => {
    const state = get();
    const card = state.cards.find((c) => c.id === id);
    if (!card) return null;
    const boardCards = state.cards.filter((c) => c.boardId === card.boardId);
    if (boardCards.length >= MAX_CARDS) {
      alert(`卡片数量已达上限（${MAX_CARDS}张），无法复制`);
      return null;
    }
    const now = Date.now();
    const maxZ = boardCards.reduce((max, c) => Math.max(max, c.zIndex), 0);
    const newCard: Card = {
      ...card,
      id: uuidv4(),
      x: card.x + 30,
      y: card.y + 30,
      zIndex: maxZ + 1,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => {
      const cards = [...s.cards, newCard];
      persistToDB({ boards: s.boards, cards, connections: s.connections });
      return { cards };
    });
    get().addSyncLog('copy_card', `复制卡片「${card.title}」`, card.boardId);
    return newCard.id;
  },

  bringCardToTop: (id) => {
    set((s) => {
      const boardCards = s.cards.filter((c) => c.boardId === s.currentBoardId);
      const maxZ = boardCards.reduce((max, c) => Math.max(max, c.zIndex), 0);
      const cards = s.cards.map((c) => (c.id === id ? { ...c, zIndex: maxZ + 1, updatedAt: Date.now() } : c));
      persistToDB({ boards: s.boards, cards, connections: s.connections });
      return { cards };
    });
    get().addSyncLog('top_card', `置顶卡片`, get().cards.find((c) => c.id === id)?.boardId || '');
  },

  addConnection: (boardId, fromCardId, toCardId) => {
    const state = get();
    const boardConnections = state.connections.filter((c) => c.boardId === boardId);
    if (boardConnections.length >= MAX_CONNECTIONS) {
      alert(`连线数量已达上限（${MAX_CONNECTIONS}条），无法继续添加`);
      return null;
    }
    const duplicate = boardConnections.find(
      (c) => (c.fromCardId === fromCardId && c.toCardId === toCardId) || (c.fromCardId === toCardId && c.toCardId === fromCardId)
    );
    if (duplicate) return null;
    if (fromCardId === toCardId) return null;
    const conn: Connection = { id: uuidv4(), boardId, fromCardId, toCardId, createdAt: Date.now() };
    set((s) => {
      const connections = [...s.connections, conn];
      persistToDB({ boards: s.boards, cards: s.cards, connections });
      return { connections };
    });
    const fromCard = state.cards.find((c) => c.id === fromCardId);
    const toCard = state.cards.find((c) => c.id === toCardId);
    get().addSyncLog('add_connection', `连接「${fromCard?.title}」→「${toCard?.title}」`, boardId);
    return conn.id;
  },

  deleteConnection: (id) => {
    const conn = get().connections.find((c) => c.id === id);
    set((s) => {
      const connections = s.connections.filter((c) => c.id !== id);
      persistToDB({ boards: s.boards, cards: s.cards, connections });
      return { connections };
    });
    if (conn) {
      get().addSyncLog('delete_connection', `删除连线`, conn.boardId);
    }
  },

  addSyncLog: (action, detail, boardId) => {
    const entry: SyncLogEntry = { id: uuidv4(), action, detail, timestamp: Date.now(), boardId };
    set((s) => {
      const syncLogs = [entry, ...s.syncLogs].slice(0, 100);
      persistSyncLogs(syncLogs);
      return { syncLogs };
    });
  },

  loadSyncLogs: () => {
    const logs = loadSyncLogsFromStorage();
    set({ syncLogs: logs });
  },

  clearSyncLogs: () => {
    persistSyncLogs([]);
    set({ syncLogs: [] });
  },
}));
