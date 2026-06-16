import { create } from 'zustand';
import type { Player, Area, Item, InteractionPoint, Slot } from '../types';
import {
  getInitialAreas,
  getInitialInteractionPoints,
  getInitialItems,
  getInitialSlots,
  checkAdjacentCombination,
  applyCombination,
} from '../puzzle/puzzleEngine';

interface RoomStore {
  playerId: string;
  playerName: string;
  roomId: string;
  players: Player[];
  areas: Area[];
  items: Item[];
  interactionPoints: InteractionPoint[];
  slots: Slot[];
  currentAreaId: string;
  gameStarted: boolean;
  gameComplete: boolean;
  combiningSlotIndices: number[] | null;
  revealMessage: string | null;
  selectedInteractionPoint: string | null;

  setPlayerInfo: (playerId: string, playerName: string) => void;
  setRoomId: (roomId: string) => void;
  setRoomState: (state: {
    players: Player[];
    areas: Area[];
    items: Item[];
    interactionPoints: InteractionPoint[];
    slots: Slot[];
    gameStarted: boolean;
    gameComplete: boolean;
  }) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setPlayerReady: (playerId: string) => void;
  startGame: () => void;
  setCurrentArea: (areaId: string) => void;
  pickItem: (itemId: string, playerId: string) => void;
  remotePickItem: (itemId: string, playerId: string) => void;
  placeSlot: (itemId: string, slotIndex: number, playerId: string) => void;
  remotePlaceSlot: (slots: Slot[]) => void;
  removeSlot: (slotIndex: number) => void;
  tryCombination: (slotIndexA: number, slotIndexB: number) => {
    success: boolean;
    rule?: ReturnType<typeof checkAdjacentCombination>['rule'];
    revealMessage?: string | null;
    unlockAreaId?: string | null;
    gameComplete?: boolean;
  };
  applyCombinationResult: (
    newItemId: string,
    removedItems: [string, string],
    revealMessage: string | null,
    unlockAreaId: string | null,
    gameComplete: boolean
  ) => void;
  remoteCombinationResult: (
    newItemId: string,
    removedItems: [string, string],
    revealMessage: string | null,
    unlockAreaId: string | null,
    gameComplete: boolean
  ) => void;
  unlockArea: (areaId: string) => void;
  setGameComplete: () => void;
  setCombiningSlotIndices: (indices: number[] | null) => void;
  setRevealMessage: (message: string | null) => void;
  setSelectedInteractionPoint: (pointId: string | null) => void;
  resetRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  playerId: '',
  playerName: '',
  roomId: '',
  players: [],
  areas: getInitialAreas(),
  items: getInitialItems(),
  interactionPoints: getInitialInteractionPoints(),
  slots: getInitialSlots(),
  currentAreaId: 'study',
  gameStarted: false,
  gameComplete: false,
  combiningSlotIndices: null,
  revealMessage: null,
  selectedInteractionPoint: null,

  setPlayerInfo: (playerId, playerName) => set({ playerId, playerName }),
  setRoomId: (roomId) => set({ roomId }),

  setRoomState: (state) => set({
    players: state.players,
    areas: state.areas,
    items: state.items,
    interactionPoints: state.interactionPoints,
    slots: state.slots,
    gameStarted: state.gameStarted,
    gameComplete: state.gameComplete,
  }),

  addPlayer: (player) => set((s) => ({
    players: [...s.players.filter((p) => p.id !== player.id), player],
  })),

  removePlayer: (playerId) => set((s) => ({
    players: s.players.filter((p) => p.id !== playerId),
  })),

  setPlayerReady: (playerId) => set((s) => ({
    players: s.players.map((p) =>
      p.id === playerId ? { ...p, ready: true } : p
    ),
  })),

  startGame: () => set({ gameStarted: true }),

  setCurrentArea: (areaId) => set({ currentAreaId: areaId }),

  pickItem: (itemId, playerId) => set((s) => ({
    items: s.items.map((item) =>
      item.id === itemId ? { ...item, picked: true, pickedBy: playerId } : item
    ),
    interactionPoints: s.interactionPoints.map((ip) =>
      ip.items.includes(itemId) ? { ...ip, explored: true } : ip
    ),
  })),

  remotePickItem: (itemId, playerId) => set((s) => ({
    items: s.items.map((item) =>
      item.id === itemId ? { ...item, picked: true, pickedBy: playerId } : item
    ),
    interactionPoints: s.interactionPoints.map((ip) =>
      ip.items.includes(itemId) ? { ...ip, explored: true } : ip
    ),
  })),

  placeSlot: (itemId, slotIndex, playerId) => set((s) => ({
    slots: s.slots.map((slot, i) =>
      i === slotIndex ? { ...slot, itemId, placedBy: playerId } : slot
    ),
  })),

  remotePlaceSlot: (slots) => set({ slots }),

  removeSlot: (slotIndex) => set((s) => ({
    slots: s.slots.map((slot, i) =>
      i === slotIndex ? { ...slot, itemId: null, placedBy: null } : slot
    ),
  })),

  tryCombination: (slotIndexA, slotIndexB) => {
    const state = get();
    const slotA = state.slots[slotIndexA];
    const slotB = state.slots[slotIndexB];
    if (!slotA?.itemId || !slotB?.itemId) return { success: false };
    const result = checkAdjacentCombination(state.slots);
    if (!result) return { success: false };
    return {
      success: true,
      rule: result.rule,
      revealMessage: result.rule.revealMessage,
      unlockAreaId: result.rule.unlockAreaId,
    };
  },

  applyCombinationResult: (newItemId, removedItems, revealMessage, unlockAreaId, gameComplete) => {
    const state = get();
    const { items: newItems, slots: newSlots, areas: newAreas, gameComplete: isComplete } = applyCombination(
      state.items,
      state.slots,
      state.areas,
      state.slots.findIndex((s) => s.itemId === removedItems[0]),
      state.slots.findIndex((s) => s.itemId === removedItems[1]),
      {
        itemA: removedItems[0],
        itemB: removedItems[1],
        resultItemId: newItemId,
        resultItemName: '',
        resultItemDescription: '',
        resultItemHint: '',
        resultItemIconEmoji: '',
        unlockAreaId,
        revealMessage,
      } as any
    );
    set({
      items: newItems,
      slots: newSlots,
      areas: newAreas,
      gameComplete: isComplete || gameComplete,
      revealMessage,
      combiningSlotIndices: null,
    });
  },

  remoteCombinationResult: (newItemId, removedItems, revealMessage, unlockAreaId, gameComplete) => {
    const state = get();
    const { items: newItems, slots: newSlots, areas: newAreas, gameComplete: isComplete } = applyCombination(
      state.items,
      state.slots,
      state.areas,
      state.slots.findIndex((s) => s.itemId === removedItems[0]),
      state.slots.findIndex((s) => s.itemId === removedItems[1]),
      {
        itemA: removedItems[0],
        itemB: removedItems[1],
        resultItemId: newItemId,
        resultItemName: '',
        resultItemDescription: '',
        resultItemHint: '',
        resultItemIconEmoji: '',
        unlockAreaId,
        revealMessage,
      } as any
    );
    set({
      items: newItems,
      slots: newSlots,
      areas: newAreas,
      gameComplete: isComplete || gameComplete,
      revealMessage,
      combiningSlotIndices: null,
    });
  },

  unlockArea: (areaId) => set((s) => ({
    areas: s.areas.map((a) =>
      a.id === areaId ? { ...a, unlocked: true } : a
    ),
  })),

  setGameComplete: () => set({ gameComplete: true }),

  setCombiningSlotIndices: (indices) => set({ combiningSlotIndices: indices }),

  setRevealMessage: (message) => set({ revealMessage: message }),

  setSelectedInteractionPoint: (pointId) => set({ selectedInteractionPoint: pointId }),

  resetRoom: () => set({
    players: [],
    areas: getInitialAreas(),
    items: getInitialItems(),
    interactionPoints: getInitialInteractionPoints(),
    slots: getInitialSlots(),
    currentAreaId: 'study',
    gameStarted: false,
    gameComplete: false,
    combiningSlotIndices: null,
    revealMessage: null,
    selectedInteractionPoint: null,
  }),
}));
