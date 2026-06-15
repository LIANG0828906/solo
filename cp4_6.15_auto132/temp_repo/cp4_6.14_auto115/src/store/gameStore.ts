import { create } from 'zustand';
import type { GameStore, Equipment, ExpeditionResult } from '../logic/types';
import {
  EQUIPMENT_DICTIONARY,
  generateMission,
  generateInitialMissions,
  simulateExpeditionAsync,
} from '../logic/gameEngine';

const MAX_WEIGHT = 20;
const MAX_SLOTS = 6;

export const useGameStore = create<GameStore>((set, get) => ({
  equipmentList: EQUIPMENT_DICTIONARY,
  missions: generateInitialMissions(3),
  packSlots: Array(MAX_SLOTS).fill(null),
  totalWeight: 0,
  currentResult: null,
  isExpediting: false,
  isOverweight: false,
  maxWeight: MAX_WEIGHT,
  maxSlots: MAX_SLOTS,

  addEquipmentToPack: (equipment: Equipment) => {
    const { packSlots, totalWeight, maxWeight } = get();

    const emptySlotIndex = packSlots.findIndex((slot) => slot === null);
    if (emptySlotIndex === -1) {
      return false;
    }

    const newWeight = totalWeight + equipment.weight;
    if (newWeight > maxWeight) {
      set({ isOverweight: true });
      setTimeout(() => set({ isOverweight: false }), 1200);
      return false;
    }

    const newPackSlots = [...packSlots];
    newPackSlots[emptySlotIndex] = equipment;

    set({
      packSlots: newPackSlots,
      totalWeight: newWeight,
    });

    return true;
  },

  removeEquipmentFromPack: (slotIndex: number) => {
    const { packSlots } = get();
    const equipment = packSlots[slotIndex];
    if (!equipment) return;

    const newPackSlots = [...packSlots];
    newPackSlots[slotIndex] = null;

    set({
      packSlots: newPackSlots,
      totalWeight: get().totalWeight - equipment.weight,
    });
  },

  generateNewMission: () => {
    const { missions } = get();
    const newMission = generateMission();
    set({
      missions: [...missions, newMission],
    });
  },

  startExpedition: () => {
    const { packSlots, missions } = get();
    const packedEquipment = packSlots.filter(
      (slot): slot is Equipment => slot !== null
    );

    if (packedEquipment.length === 0 || missions.length === 0) {
      return;
    }

    const currentMission = missions[missions.length - 1];
    set({ isExpediting: true, currentResult: null });

    simulateExpeditionAsync(packedEquipment, currentMission, (result) => {
      set({
        isExpediting: false,
        currentResult: result,
      });
    });
  },

  setExpeditionResult: (result: ExpeditionResult) => {
    set({ currentResult: result });
  },

  clearResult: () => {
    set({ currentResult: null });
  },

  setOverweight: (overweight: boolean) => {
    set({ isOverweight: overweight });
  },

  clearPack: () => {
    set({
      packSlots: Array(MAX_SLOTS).fill(null),
      totalWeight: 0,
    });
  },
}));
