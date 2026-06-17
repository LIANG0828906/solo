import { useEffect } from 'react';
import { create } from 'zustand';
import axios from 'axios';
import { LayoutMode, Card, CreateCardPayload } from '../types';
import { SceneCanvas } from './SceneCanvas';
import { UIPanel } from './UIPanel';

const API_BASE = '/api';

const WALL_SLOTS_X = [-7, -5, -3, -1, 1, 3, 5, 7];
const WALL_Z_LEFT = -3;
const WALL_Z_RIGHT = 3;
const WALL_Y = 1.5;
const SLOTS_PER_WALL = 8;

function getWallSlots(): Array<{ position: { x: number; y: number; z: number }; wallIndex: number }> {
  const slots: Array<{ position: { x: number; y: number; z: number }; wallIndex: number }> = [];
  for (let i = 0; i < SLOTS_PER_WALL; i++) {
    slots.push({ position: { x: WALL_SLOTS_X[i], y: WALL_Y, z: WALL_Z_LEFT }, wallIndex: 0 });
  }
  for (let i = 0; i < SLOTS_PER_WALL; i++) {
    slots.push({ position: { x: WALL_SLOTS_X[i], y: WALL_Y, z: WALL_Z_RIGHT }, wallIndex: 1 });
  }
  return slots;
}

function findNearestEmptySlot(
  cards: Card[],
  startIndex: number = 0,
): { position: { x: number; y: number; z: number }; wallIndex: number } | null {
  const slots = getWallSlots();
  const occupiedSlotKeys = new Set(
    cards.map((c) => `${c.position.x},${c.position.y},${c.position.z},${c.wallIndex}`),
  );
  for (let offset = 0; offset < slots.length; offset++) {
    const idx = (startIndex + offset) % slots.length;
    const slot = slots[idx];
    const key = `${slot.position.x},${slot.position.y},${slot.position.z},${slot.wallIndex}`;
    if (!occupiedSlotKeys.has(key)) {
      return slot;
    }
  }
  return null;
}

export function calculateCardPositions(
  cards: Card[],
  layoutMode: LayoutMode,
): Array<{ cardId: string; position: { x: number; y: number; z: number }; wallIndex: number }> {
  const slots = getWallSlots();
  const result: Array<{ cardId: string; position: { x: number; y: number; z: number }; wallIndex: number }> = [];

  if (layoutMode === LayoutMode.GRID) {
    const half = Math.ceil(cards.length / 2);
    const leftCards = cards.slice(0, half);
    const rightCards = cards.slice(half);
    leftCards.forEach((card, i) => {
      const slotIdx = i % SLOTS_PER_WALL;
      result.push({
        cardId: card.id,
        position: { ...slots[slotIdx].position },
        wallIndex: 0,
      });
    });
    rightCards.forEach((card, i) => {
      const slotIdx = SLOTS_PER_WALL + (i % SLOTS_PER_WALL);
      result.push({
        cardId: card.id,
        position: { ...slots[slotIdx].position },
        wallIndex: 1,
      });
    });
  } else if (layoutMode === LayoutMode.TIMELINE) {
    const sorted = [...cards].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    sorted.forEach((card, i) => {
      const wall = i < SLOTS_PER_WALL ? 0 : 1;
      const slotIdx = wall === 0 ? i : SLOTS_PER_WALL + (i - SLOTS_PER_WALL);
      const x = WALL_SLOTS_X[wall === 0 ? i : i - SLOTS_PER_WALL] ?? 0;
      result.push({
        cardId: card.id,
        position: { x, y: WALL_Y, z: wall === 0 ? WALL_Z_LEFT : WALL_Z_RIGHT },
        wallIndex: wall,
      });
    });
  } else {
    const shuffledSlots = [...slots].sort(() => Math.random() - 0.5);
    cards.forEach((card, i) => {
      const slot = shuffledSlots[i % shuffledSlots.length];
      result.push({
        cardId: card.id,
        position: { ...slot.position },
        wallIndex: slot.wallIndex,
      });
    });
  }

  return result;
}

interface GalleryState {
  cards: Card[];
  layoutMode: LayoutMode;
  loading: boolean;
  selectedCard: Card | null;
  isModalOpen: boolean;
  isEnlarged: boolean;
  enlargedCard: Card | null;
  fetchCards: () => Promise<void>;
  addCard: (payload: CreateCardPayload) => Promise<void>;
  moveCard: (id: string, position: { x: number; y: number; z: number }, wallIndex: number) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  setLayoutMode: (mode: LayoutMode) => void;
  selectCard: (card: Card | null) => void;
  setModalOpen: (open: boolean) => void;
  setEnlarged: (card: Card | null) => void;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  cards: [],
  layoutMode: LayoutMode.GRID,
  loading: false,
  selectedCard: null,
  isModalOpen: false,
  isEnlarged: false,
  enlargedCard: null,

  fetchCards: async () => {
    set({ loading: true });
    try {
      const res = await axios.get<Card[]>(`${API_BASE}/cards`);
      set({ cards: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addCard: async (payload: CreateCardPayload) => {
    try {
      const { cards } = get();
      const slot = findNearestEmptySlot(cards, 0);
      const body = {
        ...payload,
        position: payload.position ?? slot?.position,
        wallIndex: payload.wallIndex ?? slot?.wallIndex,
      };
      const res = await axios.post<Card>(`${API_BASE}/cards`, body);
      set({ cards: [...cards, res.data] });
    } catch {
      // error handled silently
    }
  },

  moveCard: async (id, position, wallIndex) => {
    try {
      await axios.put(`${API_BASE}/cards/${id}`, { position, wallIndex });
      set((state) => ({
        cards: state.cards.map((c) => (c.id === id ? { ...c, position, wallIndex } : c)),
      }));
    } catch {
      // error handled silently
    }
  },

  deleteCard: async (id) => {
    try {
      await axios.delete(`${API_BASE}/cards/${id}`);
      set((state) => ({
        cards: state.cards.filter((c) => c.id !== id),
        selectedCard: state.selectedCard?.id === id ? null : state.selectedCard,
        enlargedCard: state.enlargedCard?.id === id ? null : state.enlargedCard,
      }));
    } catch {
      // error handled silently
    }
  },

  setLayoutMode: (mode) => set({ layoutMode: mode }),
  selectCard: (card) => set({ selectedCard: card }),
  setModalOpen: (open) => set({ isModalOpen: open }),
  setEnlarged: (card) => set({ enlargedCard: card, isEnlarged: card !== null }),
}));

export function GalleryManager() {
  const {
    cards,
    layoutMode,
    loading,
    selectedCard,
    isModalOpen,
    enlargedCard,
    isEnlarged,
    fetchCards,
    addCard,
    moveCard,
    deleteCard,
    setLayoutMode,
    selectCard,
    setModalOpen,
    setEnlarged,
  } = useGalleryStore();

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCardClick = (card: Card) => {
    selectCard(card);
    setEnlarged(card);
  };

  const handleCardDrag = (id: string, position: { x: number; y: number; z: number }, wallIndex: number) => {
    moveCard(id, position, wallIndex);
  };

  const handleProximityDetect = (card: Card) => {
    selectCard(card);
  };

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  const handleCardCreate = (payload: CreateCardPayload) => {
    addCard(payload);
  };

  const handleModalToggle = (open: boolean) => {
    setModalOpen(open);
  };

  const handleCardDelete = (id: string) => {
    deleteCard(id);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0A0E17',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SceneCanvas
        cards={cards}
        layoutMode={layoutMode}
        selectedCard={selectedCard}
        enlargedCard={enlargedCard}
        onCardClick={handleCardClick}
        onCardDrag={handleCardDrag}
        onProximityDetect={handleProximityDetect}
      />
      <UIPanel
        cards={cards}
        layoutMode={layoutMode}
        isModalOpen={isModalOpen}
        selectedCard={selectedCard}
        onLayoutChange={handleLayoutChange}
        onCardCreate={handleCardCreate}
        onModalToggle={handleModalToggle}
        onCardDelete={handleCardDelete}
      />
    </div>
  );
}
