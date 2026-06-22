export type ItemType = 'key-red' | 'key-blue' | 'key-green' | 'rune-1' | 'rune-2';

export type DoorColor = 'red' | 'blue' | 'green';

export interface Item {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  x: number;
  y: number;
  discovered: boolean;
  collected: boolean;
  relatedClueId?: string;
}

export interface Clue {
  id: string;
  title: string;
  description: string;
  icon: string;
  collected: boolean;
  relatedItemId: string;
}

export interface Door {
  id: string;
  color: DoorColor;
  x: number;
  y: number;
  unlocked: boolean;
  requiredKey: ItemType;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
}

export interface GameState {
  items: Item[];
  clues: Clue[];
  doors: Door[];
  inventory: string[];
  unlockedDoors: string[];
  highlightItem: string | null;
  altarVisible: boolean;
  runeSynthesis: boolean;
  gameComplete: boolean;
  ripples: Ripple[];
  draggingItem: string | null;
  dragPosition: { x: number; y: number } | null;

  discoverItem: (id: string) => void;
  collectItem: (id: string) => void;
  collectClue: (id: string) => void;
  unlockDoor: (doorId: string, keyId: string) => void;
  setHighlightItem: (id: string | null) => void;
  setAltarVisible: (visible: boolean) => void;
  synthesizeRunes: () => void;
  addRipple: (x: number, y: number) => void;
  removeRipple: (id: string) => void;
  setDraggingItem: (id: string | null) => void;
  setDragPosition: (pos: { x: number; y: number } | null) => void;
  resetGame: () => void;
}
