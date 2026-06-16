export interface Player {
  id: string;
  name: string;
  ready: boolean;
  currentArea: string;
}

export interface InteractionPoint {
  id: string;
  label: string;
  posX: number;
  posY: number;
  explored: boolean;
  areaId: string;
  items: string[];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  hint: string;
  iconEmoji: string;
  picked: boolean;
  pickedBy: string | null;
  areaId: string;
  interactionPointId: string;
  combinableWith: string[];
  combinationResult: string | null;
}

export interface Area {
  id: string;
  name: string;
  unlocked: boolean;
  bgIllustration: string;
  interactionPoints: string[];
}

export interface Slot {
  index: number;
  itemId: string | null;
  placedBy: string | null;
}

export interface CombinationRule {
  itemA: string;
  itemB: string;
  resultItemId: string;
  resultItemName: string;
  resultItemDescription: string;
  resultItemHint: string;
  resultItemIconEmoji: string;
  unlockAreaId: string | null;
  revealMessage: string | null;
}

export interface RoomState {
  roomId: string;
  players: Player[];
  areas: Area[];
  items: Item[];
  interactionPoints: InteractionPoint[];
  slots: Slot[];
  gameStarted: boolean;
  gameComplete: boolean;
  combiningSlotIndices: number[] | null;
  lastCombinationTime: number;
}

export interface SocketEvents {
  'join-room': (data: { roomId: string; playerName: string }) => void;
  'player-ready': (data: { roomId: string }) => void;
  'pick-item': (data: { roomId: string; itemId: string; areaId: string }) => void;
  'place-slot': (data: { roomId: string; itemId: string; slotIndex: number }) => void;
  'remove-slot': (data: { roomId: string; slotIndex: number }) => void;
  'combine-items': (data: { roomId: string; slotIndices: [number, number] }) => void;
  'room-state': (state: RoomState) => void;
  'player-joined': (data: { playerId: string; playerName: string }) => void;
  'player-left': (data: { playerId: string }) => void;
  'item-picked': (data: { itemId: string; playerId: string }) => void;
  'slot-updated': (data: { slots: Slot[] }) => void;
  'items-combined': (data: { newItemId: string; removedItems: [string, string]; revealMessage: string | null; unlockAreaId: string | null }) => void;
  'area-unlocked': (data: { areaId: string }) => void;
  'game-complete': () => void;
  'switch-area': (data: { playerId: string; areaId: string }) => void;
}
