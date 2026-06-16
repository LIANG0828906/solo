import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Artifact {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface TextCard {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  width: number;
  color?: string;
}

export interface Binding {
  id: string;
  artifactId: string;
  cardId: string;
  color: string;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  fromType: 'artifact' | 'card';
  toType: 'artifact' | 'card';
}

const BINDING_COLORS = [
  '#8E44AD',
  '#2980B9',
  '#D35400',
  '#27AE60',
  '#C0392B',
];

interface ExhibitionState {
  artifacts: Artifact[];
  cards: TextCard[];
  bindings: Binding[];
  connections: Connection[];
  scrollY: number;
  isPreviewMode: boolean;
  narrativeStartId: string | null;
  isBindingMode: boolean;
  bindingCardId: string | null;
  isConnectingMode: boolean;
  connectingFromId: string | null;
  connectingFromType: 'artifact' | 'card' | null;
  selectedArtifactId: string | null;
  selectedCardId: string | null;
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    entityId: string | null;
    entityType: 'artifact' | 'card' | null;
  };
  showArtifactModal: boolean;
  isDragging: boolean;

  addArtifact: (artifact: Omit<Artifact, 'id' | 'x' | 'y' | 'width' | 'height'> & { x?: number; y?: number }) => void;
  addCard: (x?: number, y?: number) => void;
  moveEntity: (id: string, type: 'artifact' | 'card', x: number, y: number) => void;
  updateCardContent: (id: string, title?: string, description?: string) => void;
  removeArtifact: (id: string) => void;
  removeCard: (id: string) => void;
  createBinding: (cardId: string, artifactId: string) => void;
  removeBinding: (id: string) => void;
  createConnection: (fromId: string, toId: string, fromType: 'artifact' | 'card', toType: 'artifact' | 'card') => void;
  removeConnection: (id: string) => void;
  setNarrativeStart: (id: string | null) => void;
  setPreviewMode: (isPreview: boolean) => void;
  setBindingMode: (isBinding: boolean, cardId?: string) => void;
  setConnectingMode: (isConnecting: boolean, fromId?: string, fromType?: 'artifact' | 'card') => void;
  setScrollY: (scrollY: number) => void;
  setSelectedArtifact: (id: string | null) => void;
  setSelectedCard: (id: string | null) => void;
  setContextMenu: (menu: Partial<ExhibitionState['contextMenu']>) => void;
  setShowArtifactModal: (show: boolean) => void;
  setIsDragging: (isDragging: boolean) => void;
  getBindingColor: () => string;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const DB_NAME = 'ExhibitCraftDB';
const DB_VERSION = 1;
const STORE_NAME = 'exhibitions';
const EXHIBITION_KEY = 'main-exhibition';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const serializeState = (state: ExhibitionState) => {
  return {
    artifacts: state.artifacts,
    cards: state.cards,
    bindings: state.bindings,
    connections: state.connections,
    scrollY: state.scrollY,
    narrativeStartId: state.narrativeStartId,
  };
};

export const useExhibitionStore = create<ExhibitionState>((set, get) => ({
  artifacts: [],
  cards: [],
  bindings: [],
  connections: [],
  scrollY: 0,
  isPreviewMode: false,
  narrativeStartId: null,
  isBindingMode: false,
  bindingCardId: null,
  isConnectingMode: false,
  connectingFromId: null,
  connectingFromType: null,
  selectedArtifactId: null,
  selectedCardId: null,
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    entityId: null,
    entityType: null,
  },
  showArtifactModal: false,
  isDragging: false,

  addArtifact: (artifact) => {
    const state = get();
    const newArtifact: Artifact = {
      id: uuidv4(),
      name: artifact.name,
      description: artifact.description,
      imageUrl: artifact.imageUrl,
      x: artifact.x ?? 200 + state.artifacts.length * 30,
      y: artifact.y ?? 120 + state.artifacts.length * 30,
      width: 160,
      height: 160,
    };
    set({ artifacts: [...state.artifacts, newArtifact] });
  },

  addCard: (x, y) => {
    const state = get();
    const cardWidth = 320;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const newCard: TextCard = {
      id: uuidv4(),
      title: '请输入标题',
      description: '请输入描述文字',
      x: x ?? (viewportWidth - cardWidth) / 2,
      y: y ?? 150 + state.cards.length * 40,
      width: cardWidth,
    };
    set({ cards: [...state.cards, newCard] });
  },

  moveEntity: (id, type, x, y) => {
    const state = get();
    
    if (type === 'artifact') {
      const artifact = state.artifacts.find(a => a.id === id);
      if (!artifact) return;

      const dx = x - artifact.x;
      const dy = y - artifact.y;

      const relatedBindings = state.bindings.filter(b => b.artifactId === id);
      const updatedCards = state.cards.map(card => {
        const binding = relatedBindings.find(b => b.cardId === card.id);
        if (binding) {
          return { ...card, x: card.x + dx, y: card.y + dy };
        }
        return card;
      });

      const updatedArtifacts = state.artifacts.map(a =>
        a.id === id ? { ...a, x, y } : a
      );

      set({ artifacts: updatedArtifacts, cards: updatedCards });
    } else {
      const card = state.cards.find(c => c.id === id);
      if (!card) return;

      const dx = x - card.x;
      const dy = y - card.y;

      const relatedBindings = state.bindings.filter(b => b.cardId === id);
      const updatedArtifacts = state.artifacts.map(artifact => {
        const binding = relatedBindings.find(b => b.artifactId === artifact.id);
        if (binding) {
          return { ...artifact, x: artifact.x + dx, y: artifact.y + dy };
        }
        return artifact;
      });

      const updatedCards = state.cards.map(c =>
        c.id === id ? { ...c, x, y } : c
      );

      set({ cards: updatedCards, artifacts: updatedArtifacts });
    }
  },

  updateCardContent: (id, title, description) => {
    const state = get();
    set({
      cards: state.cards.map(c =>
        c.id === id
          ? { ...c, title: title ?? c.title, description: description ?? c.description }
          : c
      ),
    });
  },

  removeArtifact: (id) => {
    const state = get();
    set({
      artifacts: state.artifacts.filter(a => a.id !== id),
      bindings: state.bindings.filter(b => b.artifactId !== id),
      connections: state.connections.filter(c => 
        !(c.fromId === id && c.fromType === 'artifact') && 
        !(c.toId === id && c.toType === 'artifact')
      ),
    });
  },

  removeCard: (id) => {
    const state = get();
    set({
      cards: state.cards.filter(c => c.id !== id),
      bindings: state.bindings.filter(b => b.cardId !== id),
      connections: state.connections.filter(c => 
        !(c.fromId === id && c.fromType === 'card') && 
        !(c.toId === id && c.toType === 'card')
      ),
    });
  },

  createBinding: (cardId, artifactId) => {
    const state = get();
    const existingBinding = state.bindings.find(
      b => b.cardId === cardId && b.artifactId === artifactId
    );
    if (existingBinding) return;

    const color = state.getBindingColor();
    const newBinding: Binding = {
      id: uuidv4(),
      artifactId,
      cardId,
      color,
    };

    const updatedArtifacts = state.artifacts.map(a =>
      a.id === artifactId ? { ...a, color } : a
    );
    const updatedCards = state.cards.map(c =>
      c.id === cardId ? { ...c, color } : c
    );

    set({
      bindings: [...state.bindings, newBinding],
      artifacts: updatedArtifacts,
      cards: updatedCards,
      isBindingMode: false,
      bindingCardId: null,
    });
  },

  removeBinding: (id) => {
    const state = get();
    const binding = state.bindings.find(b => b.id === id);
    if (!binding) return;

    set({
      bindings: state.bindings.filter(b => b.id !== id),
      artifacts: state.artifacts.map(a =>
        a.id === binding.artifactId ? { ...a, color: undefined } : a
      ),
      cards: state.cards.map(c =>
        c.id === binding.cardId ? { ...c, color: undefined } : c
      ),
    });
  },

  createConnection: (fromId, toId, fromType, toType) => {
    const state = get();
    const exists = state.connections.some(
      c => c.fromId === fromId && c.toId === toId
    );
    if (exists) return;

    const newConnection: Connection = {
      id: uuidv4(),
      fromId,
      toId,
      fromType,
      toType,
    };

    set({
      connections: [...state.connections, newConnection],
      isConnectingMode: false,
      connectingFromId: null,
      connectingFromType: null,
    });
  },

  removeConnection: (id) => {
    const state = get();
    set({ connections: state.connections.filter(c => c.id !== id) });
  },

  setNarrativeStart: (id) => {
    set({ narrativeStartId: id });
  },

  setPreviewMode: (isPreview) => {
    set({ isPreviewMode: isPreview });
  },

  setBindingMode: (isBinding, cardId) => {
    set({
      isBindingMode: isBinding,
      bindingCardId: cardId ?? null,
    });
  },

  setConnectingMode: (isConnecting, fromId, fromType) => {
    set({
      isConnectingMode: isConnecting,
      connectingFromId: fromId ?? null,
      connectingFromType: fromType ?? null,
    });
  },

  setScrollY: (scrollY) => {
    set({ scrollY });
  },

  setSelectedArtifact: (id) => {
    set({ selectedArtifactId: id });
  },

  setSelectedCard: (id) => {
    set({ selectedCardId: id });
  },

  setContextMenu: (menu) => {
    const state = get();
    set({
      contextMenu: { ...state.contextMenu, ...menu },
    });
  },

  setShowArtifactModal: (show) => {
    set({ showArtifactModal: show });
  },

  setIsDragging: (isDragging) => {
    set({ isDragging });
  },

  getBindingColor: () => {
    const state = get();
    const usedColors = state.bindings.map(b => b.color);
    const availableColors = BINDING_COLORS.filter(c => !usedColors.includes(c));
    if (availableColors.length > 0) {
      return availableColors[0];
    }
    return BINDING_COLORS[state.bindings.length % BINDING_COLORS.length];
  },

  saveToStorage: async () => {
    const state = get();
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(serializeState(state), EXHIBITION_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  },

  loadFromStorage: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(EXHIBITION_KEY);
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          set({
            artifacts: data.artifacts || [],
            cards: data.cards || [],
            bindings: data.bindings || [],
            connections: data.connections || [],
            scrollY: data.scrollY || 0,
            narrativeStartId: data.narrativeStartId || null,
          });
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  },
}));
