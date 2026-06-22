import { create } from 'zustand';
import type { GameState, Battleship, Slot, Part, Fleet, MissionLog, MissionType } from '../types';

const WEAPON_PARTS: Part[] = [
  { id: 'weapon-1', name: '激光炮', category: 'weapon', value: 12, icon: '⚡' },
  { id: 'weapon-2', name: '离子炮', category: 'weapon', value: 15, icon: '💫' },
  { id: 'weapon-3', name: '导弹发射器', category: 'weapon', value: 18, icon: '🚀' },
  { id: 'weapon-4', name: '电磁炮', category: 'weapon', value: 20, icon: '🔩' },
  { id: 'weapon-5', name: '相位炮', category: 'weapon', value: 22, icon: '✨' },
];

const SHIELD_PARTS: Part[] = [
  { id: 'shield-1', name: '能量护盾', category: 'shield', value: 18, icon: '🛡️' },
  { id: 'shield-2', name: '偏导护盾', category: 'shield', value: 20, icon: '🔷' },
  { id: 'shield-3', name: '吸收护盾', category: 'shield', value: 22, icon: '💠' },
  { id: 'shield-4', name: '反射护盾', category: 'shield', value: 25, icon: '🔮' },
];

const ENGINE_PARTS: Part[] = [
  { id: 'engine-1', name: '曲速引擎', category: 'engine', value: 25, icon: '🌟' },
  { id: 'engine-2', name: '脉冲引擎', category: 'engine', value: 22, icon: '💨' },
  { id: 'engine-3', name: '离子引擎', category: 'engine', value: 20, icon: '⚙️' },
  { id: 'engine-4', name: '跃迁引擎', category: 'engine', value: 28, icon: '🌌' },
];

const ALL_PARTS: Part[] = [...WEAPON_PARTS, ...SHIELD_PARTS, ...ENGINE_PARTS];

const generateId = () => Math.random().toString(36).substring(2, 11);

const createInitialSlots = (): Slot[] => {
  const weaponSlots: Slot[] = [
    { id: 'weapon-slot-1', type: 'weapon', x: 65, y: 28, part: null },
    { id: 'weapon-slot-2', type: 'weapon', x: 65, y: 92, part: null },
    { id: 'weapon-slot-3', type: 'weapon', x: 155, y: 22, part: null },
    { id: 'weapon-slot-4', type: 'weapon', x: 235, y: 22, part: null },
    { id: 'weapon-slot-5', type: 'weapon', x: 295, y: 28, part: null },
    { id: 'weapon-slot-6', type: 'weapon', x: 295, y: 92, part: null },
  ];

  const shieldSlots: Slot[] = [
    { id: 'shield-slot-1', type: 'shield', x: 110, y: 58, part: null },
    { id: 'shield-slot-2', type: 'shield', x: 190, y: 52, part: null },
    { id: 'shield-slot-3', type: 'shield', x: 270, y: 58, part: null },
    { id: 'shield-slot-4', type: 'shield', x: 190, y: 90, part: null },
  ];

  const engineSlots: Slot[] = [
    { id: 'engine-slot-1', type: 'engine', x: 338, y: 32, part: null },
    { id: 'engine-slot-2', type: 'engine', x: 338, y: 60, part: null },
    { id: 'engine-slot-3', type: 'engine', x: 338, y: 88, part: null },
  ];

  return [...weaponSlots, ...shieldSlots, ...engineSlots];
};

const createInitialShip = (): Battleship => ({
  id: generateId(),
  name: '侦察舰',
  type: 'scout',
  slots: createInitialSlots(),
  firepower: 0,
  shield: 0,
  speed: 0,
});

const calculateStatsFn = (slots: Slot[]) => {
  let firepower = 0;
  let shield = 0;
  let speed = 0;

  slots.forEach((slot) => {
    if (slot.part) {
      if (slot.type === 'weapon') firepower += slot.part.value;
      if (slot.type === 'shield') shield += slot.part.value;
      if (slot.type === 'engine') speed += slot.part.value;
    }
  });

  return {
    firepower: Math.min(100, Math.round(firepower)),
    shield: Math.min(100, Math.round(shield)),
    speed: Math.min(100, Math.round(speed)),
  };
};

export const useGameStore = create<GameState>((set, get) => ({
  currentShip: createInitialShip(),
  fleets: [],
  missionLogs: [],
  availableParts: ALL_PARTS,
  draggedPart: null,

  setDraggedPart: (part) => set({ draggedPart: part }),

  placePart: (slotId, part) => {
    set((state) => {
      const isPartUsed = state.currentShip.slots.some(
        (s) => s.part?.id === part.id && s.id !== slotId
      );
      if (isPartUsed) return state;

      const newSlots = state.currentShip.slots.map((slot) =>
        slot.id === slotId && slot.type === part.category
          ? { ...slot, part }
          : slot
      );

      const stats = calculateStatsFn(newSlots);

      return {
        currentShip: {
          ...state.currentShip,
          slots: newSlots,
          ...stats,
        },
      };
    });
  },

  removePart: (slotId) => {
    set((state) => {
      const newSlots = state.currentShip.slots.map((slot) =>
        slot.id === slotId ? { ...slot, part: null } : slot
      );

      const stats = calculateStatsFn(newSlots);

      return {
        currentShip: {
          ...state.currentShip,
          slots: newSlots,
          ...stats,
        },
      };
    });
  },

  calculateStats: calculateStatsFn,

  saveFleet: (name) => {
    const state = get();
    if (state.fleets.length >= 6) {
      return { success: false, message: '船坞空间已满，请删除旧舰队' };
    }

    const shipCopy: Battleship = {
      ...state.currentShip,
      id: generateId(),
      slots: state.currentShip.slots.map((s) => ({ ...s, part: s.part ? { ...s.part } : null })),
    };

    const stats = calculateStatsFn(shipCopy.slots);
    shipCopy.firepower = stats.firepower;
    shipCopy.shield = stats.shield;
    shipCopy.speed = stats.speed;

    const powerRating = Math.round(
      stats.firepower * 0.4 + stats.shield * 0.3 + stats.speed * 0.3
    );

    const newFleet: Fleet = {
      id: generateId(),
      name,
      ships: [shipCopy],
      powerRating,
    };

    set((state) => ({
      fleets: [...state.fleets, newFleet],
    }));

    return { success: true };
  },

  deleteFleet: (fleetId) => {
    set((state) => ({
      fleets: state.fleets.filter((f) => f.id !== fleetId),
    }));
  },

  executeMission: (fleetId, missionType) => {
    const state = get();
    const fleet = state.fleets.find((f) => f.id === fleetId);
    if (!fleet) return;

    const success = Math.random() > 0.4;

    const log: MissionLog = {
      id: generateId(),
      missionType,
      fleetName: fleet.name,
      success,
      timestamp: Date.now(),
    };

    set((state) => {
      const newLogs = [log, ...state.missionLogs].slice(0, 20);
      return { missionLogs: newLogs };
    });
  },

  resetCurrentShip: () => {
    set({ currentShip: createInitialShip() });
  },
}));
