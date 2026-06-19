import { create } from 'zustand';
import type { Item, Clue, Door, ItemType, DoorColor, Ripple } from './types';
import { initialItems, initialClues, initialDoors } from './utils/gameData';
import { playSound } from './utils/sound';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

interface GameStoreState {
  items: Item[];
  clues: Clue[];
  doors: Door[];
  inventory: ItemType[];
  unlockedDoors: DoorColor[];
  highlightItem: string | null;
  altarVisible: boolean;
  runeSynthesis: boolean;
  gameComplete: boolean;
  ripples: Ripple[];
  draggingItem: ItemType | null;
  dragPosition: { x: number; y: number } | null;

  discoverItem: (itemId: string) => void;
  collectItem: (itemId: string) => void;
  collectClue: (clueId: string) => void;
  setHighlightItem: (itemId: string | null) => void;
  unlockDoor: (doorColor: DoorColor, keyType: ItemType) => boolean;
  useItem: (itemType: ItemType, target?: string) => void;
  synthesizeRune: () => boolean;
  addRipple: (x: number, y: number) => void;
  removeRipple: (rippleId: string) => void;
  setDraggingItem: (item: ItemType | null, pos?: { x: number; y: number }) => void;
  setDragPosition: (pos: { x: number; y: number } | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  items: deepClone(initialItems),
  clues: deepClone(initialClues),
  doors: deepClone(initialDoors),
  inventory: [],
  unlockedDoors: [],
  highlightItem: null,
  altarVisible: false,
  runeSynthesis: false,
  gameComplete: false,
  ripples: [],
  draggingItem: null,
  dragPosition: null,

  discoverItem: (itemId: string) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, discovered: true } : item
      ),
    }));
    playSound('collect');
  },

  collectItem: (itemId: string) => {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item || item.collected) return state;
      return {
        items: state.items.map((i) =>
          i.id === itemId ? { ...i, collected: true } : i
        ),
        inventory: [...state.inventory, item.type],
      };
    });
    playSound('collect');
  },

  collectClue: (clueId: string) => {
    set((state) => ({
      clues: state.clues.map((clue) =>
        clue.id === clueId ? { ...clue, collected: true } : clue
      ),
    }));
    playSound('collect');
  },

  setHighlightItem: (itemId: string | null) => {
    set({ highlightItem: itemId });
  },

  unlockDoor: (doorColor: DoorColor, keyType: ItemType): boolean => {
    const state = get();
    const door = state.doors.find((d) => d.color === doorColor);

    if (!door || door.unlocked) {
      return false;
    }

    if (door.requiredKey !== keyType) {
      playSound('error');
      return false;
    }

    set((prev) => {
      const newUnlockedDoors = [...prev.unlockedDoors, doorColor];
      const allDoorsUnlocked = newUnlockedDoors.length === prev.doors.length;
      return {
        doors: prev.doors.map((d) =>
          d.color === doorColor ? { ...d, unlocked: true } : d
        ),
        unlockedDoors: newUnlockedDoors,
        inventory: prev.inventory.filter((item) => item !== keyType),
        altarVisible: allDoorsUnlocked ? true : prev.altarVisible,
      };
    });

    playSound('unlock');
    return true;
  },

  useItem: (itemType: ItemType, target?: string) => {
    if (target) {
      const door = get().doors.find((d) => d.color === target);
      if (door) {
        get().unlockDoor(target as DoorColor, itemType);
      }
    } else if (itemType.startsWith('rune-')) {
      get().synthesizeRune();
    }
  },

  synthesizeRune: (): boolean => {
    const state = get();
    const hasRune1 = state.inventory.includes('rune-1');
    const hasRune2 = state.inventory.includes('rune-2');

    if (!hasRune1 || !hasRune2) {
      return false;
    }

    set((prev) => ({
      runeSynthesis: true,
      inventory: prev.inventory.filter(
        (item) => item !== 'rune-1' && item !== 'rune-2'
      ),
      gameComplete: true,
    }));

    playSound('success');
    return true;
  },

  addRipple: (x: number, y: number) => {
    const rippleId = `ripple-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      ripples: [...state.ripples, { id: rippleId, x, y }],
    }));

    setTimeout(() => {
      get().removeRipple(rippleId);
    }, 600);
  },

  removeRipple: (rippleId: string) => {
    set((state) => ({
      ripples: state.ripples.filter((r) => r.id !== rippleId),
    }));
  },

  setDraggingItem: (item: ItemType | null, pos?: { x: number; y: number }) => {
    set({
      draggingItem: item,
      dragPosition: pos ?? null,
    });
  },

  setDragPosition: (pos: { x: number; y: number } | null) => {
    set({ dragPosition: pos });
  },

  resetGame: () => {
    set({
      items: deepClone(initialItems),
      clues: deepClone(initialClues),
      doors: deepClone(initialDoors),
      inventory: [],
      unlockedDoors: [],
      highlightItem: null,
      altarVisible: false,
      runeSynthesis: false,
      gameComplete: false,
      ripples: [],
      draggingItem: null,
      dragPosition: null,
    });
  },
}));
