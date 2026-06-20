import { create } from 'zustand';

export type ShapeType = 'circle' | 'rectangle' | 'triangle';

export interface Position {
  x: number;
  y: number;
}

export interface ShapeConfig {
  id: string;
  type: ShapeType;
  color: string;
  width: number;
  height: number;
  targetSlotId: string;
  isSnapped: boolean;
  isReturning: boolean;
  returnFrom: Position | null;
  rotation: number;
}

export interface SlotConfig {
  id: string;
  shapeType: ShapeType;
  color: string;
  position: Position;
  width: number;
  height: number;
  isOccupied: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  shapes: ShapeConfig[];
  slots: SlotConfig[];
}

function createLevel1(): LevelConfig {
  const shapes: ShapeConfig[] = [
    { id: 's1', type: 'circle', color: '#FF6B6B', width: 80, height: 80, targetSlotId: 'sl1', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's2', type: 'rectangle', color: '#4FC3F7', width: 80, height: 60, targetSlotId: 'sl2', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's3', type: 'triangle', color: '#FFD93D', width: 80, height: 80, targetSlotId: 'sl3', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's4', type: 'circle', color: '#FF6B6B', width: 80, height: 80, targetSlotId: 'sl4', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's5', type: 'rectangle', color: '#4FC3F7', width: 80, height: 60, targetSlotId: 'sl5', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's6', type: 'triangle', color: '#FFD93D', width: 80, height: 80, targetSlotId: 'sl6', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
  ];
  const slots: SlotConfig[] = [
    { id: 'sl1', shapeType: 'circle', color: '#FF6B6B', position: { x: 150, y: 130 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl2', shapeType: 'rectangle', color: '#4FC3F7', position: { x: 300, y: 130 }, width: 80, height: 60, isOccupied: false },
    { id: 'sl3', shapeType: 'triangle', color: '#FFD93D', position: { x: 450, y: 130 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl4', shapeType: 'circle', color: '#FF6B6B', position: { x: 150, y: 280 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl5', shapeType: 'rectangle', color: '#4FC3F7', position: { x: 300, y: 280 }, width: 80, height: 60, isOccupied: false },
    { id: 'sl6', shapeType: 'triangle', color: '#FFD93D', position: { x: 450, y: 280 }, width: 80, height: 80, isOccupied: false },
  ];
  return { id: 1, name: '初级', shapes, slots };
}

function createLevel2(): LevelConfig {
  const shapes: ShapeConfig[] = [
    { id: 's1', type: 'circle', color: '#FF6B6B', width: 80, height: 80, targetSlotId: 'sl1', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's2', type: 'rectangle', color: '#4FC3F7', width: 80, height: 60, targetSlotId: 'sl2', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's3', type: 'triangle', color: '#FFD93D', width: 80, height: 80, targetSlotId: 'sl3', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's4', type: 'circle', color: '#FF6B6B', width: 80, height: 80, targetSlotId: 'sl4', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's5', type: 'rectangle', color: '#4FC3F7', width: 80, height: 60, targetSlotId: 'sl5', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's6', type: 'triangle', color: '#FFD93D', width: 80, height: 80, targetSlotId: 'sl6', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's7', type: 'circle', color: '#FF6B6B', width: 80, height: 80, targetSlotId: 'sl7', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's8', type: 'rectangle', color: '#4FC3F7', width: 80, height: 60, targetSlotId: 'sl8', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
  ];
  const slots: SlotConfig[] = [
    { id: 'sl1', shapeType: 'circle', color: '#FF6B6B', position: { x: 120, y: 130 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl2', shapeType: 'rectangle', color: '#4FC3F7', position: { x: 260, y: 130 }, width: 80, height: 60, isOccupied: false },
    { id: 'sl3', shapeType: 'triangle', color: '#FFD93D', position: { x: 400, y: 130 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl4', shapeType: 'circle', color: '#FF6B6B', position: { x: 510, y: 130 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl5', shapeType: 'rectangle', color: '#4FC3F7', position: { x: 120, y: 280 }, width: 80, height: 60, isOccupied: false },
    { id: 'sl6', shapeType: 'triangle', color: '#FFD93D', position: { x: 260, y: 280 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl7', shapeType: 'circle', color: '#FF6B6B', position: { x: 400, y: 280 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl8', shapeType: 'rectangle', color: '#4FC3F7', position: { x: 510, y: 280 }, width: 80, height: 60, isOccupied: false },
  ];
  return { id: 2, name: '中级', shapes, slots };
}

function createLevel3(): LevelConfig {
  const shapes: ShapeConfig[] = [
    { id: 's1', type: 'circle', color: '#FF6B6B', width: 80, height: 80, targetSlotId: 'sl1', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's2', type: 'rectangle', color: '#4FC3F7', width: 80, height: 60, targetSlotId: 'sl2', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's3', type: 'triangle', color: '#FFD93D', width: 80, height: 80, targetSlotId: 'sl3', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's4', type: 'circle', color: '#FF6B6B', width: 80, height: 80, targetSlotId: 'sl4', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's5', type: 'rectangle', color: '#4FC3F7', width: 80, height: 60, targetSlotId: 'sl5', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's6', type: 'triangle', color: '#FFD93D', width: 80, height: 80, targetSlotId: 'sl6', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's7', type: 'circle', color: '#FF6B6B', width: 80, height: 80, targetSlotId: 'sl7', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's8', type: 'rectangle', color: '#4FC3F7', width: 80, height: 60, targetSlotId: 'sl8', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
    { id: 's9', type: 'triangle', color: '#FFD93D', width: 80, height: 80, targetSlotId: 'sl9', isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 },
  ];
  const slots: SlotConfig[] = [
    { id: 'sl1', shapeType: 'circle', color: '#FF6B6B', position: { x: 150, y: 100 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl2', shapeType: 'rectangle', color: '#4FC3F7', position: { x: 300, y: 100 }, width: 80, height: 60, isOccupied: false },
    { id: 'sl3', shapeType: 'triangle', color: '#FFD93D', position: { x: 450, y: 100 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl4', shapeType: 'circle', color: '#FF6B6B', position: { x: 150, y: 200 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl5', shapeType: 'rectangle', color: '#4FC3F7', position: { x: 300, y: 200 }, width: 80, height: 60, isOccupied: false },
    { id: 'sl6', shapeType: 'triangle', color: '#FFD93D', position: { x: 450, y: 200 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl7', shapeType: 'circle', color: '#FF6B6B', position: { x: 150, y: 300 }, width: 80, height: 80, isOccupied: false },
    { id: 'sl8', shapeType: 'rectangle', color: '#4FC3F7', position: { x: 300, y: 300 }, width: 80, height: 60, isOccupied: false },
    { id: 'sl9', shapeType: 'triangle', color: '#FFD93D', position: { x: 450, y: 300 }, width: 80, height: 80, isOccupied: false },
  ];
  return { id: 3, name: '高级', shapes, slots };
}

const allLevels = [createLevel1(), createLevel2(), createLevel3()];

interface GameState {
  levels: LevelConfig[];
  currentLevel: number;
  shapes: ShapeConfig[];
  slots: SlotConfig[];
  isCompleted: boolean;
  showCompleteModal: boolean;
  draggingId: string | null;
  dragPosition: Position | null;
  dragOffset: Position | null;
  slotFlashing: Record<string, number>;
  slotError: Record<string, boolean>;
  levelTransition: boolean;

  switchLevel: (levelId: number) => void;
  startDrag: (shapeId: string, position: Position, offset: Position) => void;
  moveDrag: (position: Position) => void;
  endDrag: () => void;
  snapShape: (shapeId: string, slotId: string) => void;
  returnShape: (shapeId: string, from: Position) => void;
  clearReturn: (shapeId: string) => void;
  resetShapes: () => void;
  randomizeShapes: () => void;
  triggerSlotFlash: (slotId: string, count: number) => void;
  triggerSlotError: (slotId: string) => void;
  clearSlotFlash: (slotId: string) => void;
  clearSlotError: (slotId: string) => void;
  setLevelTransition: (v: boolean) => void;
}

function initLevel(levelIndex: number): { shapes: ShapeConfig[]; slots: SlotConfig[] } {
  const level = allLevels[levelIndex];
  return {
    shapes: level.shapes.map(s => ({ ...s, isSnapped: false, isReturning: false, returnFrom: null, rotation: 0 })),
    slots: level.slots.map(s => ({ ...s, isOccupied: false })),
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  levels: allLevels,
  currentLevel: 0,
  ...initLevel(0),
  isCompleted: false,
  showCompleteModal: false,
  draggingId: null,
  dragPosition: null,
  dragOffset: null,
  slotFlashing: {},
  slotError: {},
  levelTransition: false,

  switchLevel: (levelId: number) => {
    const idx = allLevels.findIndex(l => l.id === levelId);
    if (idx === -1 || idx === get().currentLevel) return;
    set({ levelTransition: true });
    setTimeout(() => {
      set({ currentLevel: idx, ...initLevel(idx), isCompleted: false, showCompleteModal: false, slotFlashing: {}, slotError: {} });
      setTimeout(() => set({ levelTransition: false }), 50);
    }, 400);
  },

  startDrag: (shapeId, position, offset) => {
    set({ draggingId: shapeId, dragPosition: position, dragOffset: offset });
  },

  moveDrag: (position) => {
    set({ dragPosition: position });
  },

  endDrag: () => {
    set({ draggingId: null, dragPosition: null, dragOffset: null });
  },

  snapShape: (shapeId, slotId) => {
    const { shapes, slots } = get();
    const newShapes = shapes.map(s =>
      s.id === shapeId ? { ...s, isSnapped: true, isReturning: false, returnFrom: null, rotation: 0 } : s
    );
    const newSlots = slots.map(s =>
      s.id === slotId ? { ...s, isOccupied: true } : s
    );
    const isCompleted = newShapes.every(s => s.isSnapped);
    set({
      shapes: newShapes,
      slots: newSlots,
      draggingId: null,
      dragPosition: null,
      dragOffset: null,
      isCompleted,
      showCompleteModal: isCompleted,
    });
  },

  returnShape: (shapeId, from) => {
    const { shapes } = get();
    const newShapes = shapes.map(s =>
      s.id === shapeId ? { ...s, isReturning: true, returnFrom: from, rotation: 0 } : s
    );
    set({ shapes: newShapes, draggingId: null, dragPosition: null, dragOffset: null });
  },

  clearReturn: (shapeId) => {
    const { shapes } = get();
    const newShapes = shapes.map(s =>
      s.id === shapeId ? { ...s, isReturning: false, returnFrom: null } : s
    );
    set({ shapes: newShapes });
  },

  resetShapes: () => {
    const { currentLevel } = get();
    set({ ...initLevel(currentLevel), isCompleted: false, showCompleteModal: false, slotFlashing: {}, slotError: {} });
  },

  randomizeShapes: () => {
    const { currentLevel, shapes } = get();
    const level = allLevels[currentLevel];
    const shuffledSlotIds = level.slots.map(s => s.id).sort(() => Math.random() - 0.5);
    const newShapes = shapes.map((s, i) => ({
      ...s,
      targetSlotId: shuffledSlotIds[i] || s.targetSlotId,
      isSnapped: false,
      isReturning: false,
      returnFrom: null,
      rotation: Math.random() * 30 - 15,
    }));
    const newSlots = level.slots.map(s => ({ ...s, isOccupied: false }));
    set({ shapes: newShapes, slots: newSlots, isCompleted: false, showCompleteModal: false, slotFlashing: {}, slotError: {} });
  },

  triggerSlotFlash: (slotId, count) => {
    set(state => ({ slotFlashing: { ...state.slotFlashing, [slotId]: count } }));
  },

  triggerSlotError: (slotId) => {
    set(state => ({ slotError: { ...state.slotError, [slotId]: true } }));
  },

  clearSlotFlash: (slotId) => {
    set(state => {
      const next = { ...state.slotFlashing };
      delete next[slotId];
      return { slotFlashing: next };
    });
  },

  clearSlotError: (slotId) => {
    set(state => {
      const next = { ...state.slotError };
      delete next[slotId];
      return { slotError: next };
    });
  },

  setLevelTransition: (v) => set({ levelTransition: v }),
}));
