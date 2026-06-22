import { create } from 'zustand';
import _ from 'lodash';
import {
  INITIAL_MATERIALS,
  BASE_POTIONS,
  type Material,
  type Potion,
  type PotionQuality,
  type PotionType,
} from './types';
import { usePotionStore } from '../potion/store';

interface BrewingState {
  materials: Material[];
  cauldronMaterials: { materialId: string; count: number }[];
  temperature: number;
  stirCount: number;
  progress: number;
  isBrewing: boolean;
  isExploding: boolean;
  temperatureLog: number[];
  activeEffect: { text: string; type: PotionType } | null;

  setTemperature: (temp: number) => void;
  incrementStir: () => void;
  addMaterialToCauldron: (materialId: string) => void;
  removeMaterialFromCauldron: (materialId: string) => void;
  startBrewing: () => void;
  cancelBrewing: () => void;
  tickProgress: () => void;
  resetCauldron: () => void;
  triggerExplosion: () => void;
  setActiveEffect: (effect: { text: string; type: PotionType } | null) => void;
}

const determinePotion = (
  materialIds: string[]
): { name: string; type: PotionType; icon: string; effect: string } | null => {
  const sortedIds = _.sortBy(materialIds);
  const combinations: string[][] = [];

  for (let size = sortedIds.length; size >= 2; size--) {
    const getCombinations = (arr: string[], n: number): string[][] => {
      if (n === 0) return [[]];
      if (arr.length === 0) return [];
      const [first, ...rest] = arr;
      const withFirst = getCombinations(rest, n - 1).map((c) => [first, ...c]);
      const withoutFirst = getCombinations(rest, n);
      return [...withFirst, ...withoutFirst];
    };
    combinations.push(...getCombinations(sortedIds, size));
  }

  for (const combo of combinations) {
    const key = combo.join('+');
    if (BASE_POTIONS[key]) {
      return BASE_POTIONS[key];
    }
  }

  if (materialIds.length > 0) {
    return {
      name: '神秘药剂',
      type: 'unknown',
      icon: '❓',
      effect: '效果未知的神秘药剂',
    };
  }

  return null;
};

const calculateQuality = (
  materials: Material[],
  avgTemp: number,
  stirCount: number
): PotionQuality => {
  if (materials.length === 0) return 'normal';

  let tempScore = 0;
  materials.forEach((m) => {
    const midTemp = (m.tempMin + m.tempMax) / 2;
    const tolerance = (m.tempMax - m.tempMin) / 2;
    const diff = Math.abs(avgTemp - midTemp);
    tempScore += Math.max(0, 1 - diff / tolerance);
  });
  tempScore = tempScore / materials.length;

  const idealStir = materials.length * 3;
  const stirScore = Math.max(0, 1 - Math.abs(stirCount - idealStir) / idealStir);

  const totalScore = tempScore * 0.6 + stirScore * 0.4;

  if (totalScore >= 0.85) return 'perfect';
  if (totalScore >= 0.6) return 'good';
  return 'normal';
};

export const useBrewingStore = create<BrewingState>((set, get) => ({
  materials: INITIAL_MATERIALS,
  cauldronMaterials: [],
  temperature: 100,
  stirCount: 0,
  progress: 0,
  isBrewing: false,
  isExploding: false,
  temperatureLog: [],
  activeEffect: null,

  setTemperature: (temp) => {
    const clamped = Math.max(0, Math.min(300, temp));
    set((state) => ({
      temperature: clamped,
      temperatureLog: state.isBrewing
        ? [...state.temperatureLog, clamped]
        : state.temperatureLog,
    }));
  },

  incrementStir: () => {
    set((state) => ({ stirCount: state.stirCount + 1 }));
  },

  addMaterialToCauldron: (materialId) => {
    const { materials, cauldronMaterials, isBrewing } = get();
    if (isBrewing) return;

    const material = materials.find((m) => m.id === materialId);
    if (!material) return;

    const inCauldron = cauldronMaterials.find(
      (cm) => cm.materialId === materialId
    );
    const totalUsed = inCauldron ? inCauldron.count : 0;

    if (material.count - totalUsed <= 0) return;

    set((state) => {
      const existing = state.cauldronMaterials.find(
        (cm) => cm.materialId === materialId
      );
      if (existing) {
        return {
          cauldronMaterials: state.cauldronMaterials.map((cm) =>
            cm.materialId === materialId ? { ...cm, count: cm.count + 1 } : cm
          ),
        };
      }
      return {
        cauldronMaterials: [
          ...state.cauldronMaterials,
          { materialId, count: 1 },
        ],
      };
    });
  },

  removeMaterialFromCauldron: (materialId) => {
    const { isBrewing } = get();
    if (isBrewing) return;

    set((state) => {
      const existing = state.cauldronMaterials.find(
        (cm) => cm.materialId === materialId
      );
      if (!existing) return state;
      if (existing.count > 1) {
        return {
          cauldronMaterials: state.cauldronMaterials.map((cm) =>
            cm.materialId === materialId ? { ...cm, count: cm.count - 1 } : cm
          ),
        };
      }
      return {
        cauldronMaterials: state.cauldronMaterials.filter(
          (cm) => cm.materialId !== materialId
        ),
      };
    });
  },

  startBrewing: () => {
    const { cauldronMaterials, temperature } = get();
    if (cauldronMaterials.length === 0) return;

    set({
      isBrewing: true,
      progress: 0,
      temperatureLog: [temperature],
      isExploding: false,
    });
  },

  cancelBrewing: () => {
    const { cauldronMaterials, temperatureLog, stirCount, materials } = get();

    const recordMaterials = cauldronMaterials.map((cm) => {
      const m = materials.find((mat) => mat.id === cm.materialId)!;
      return { name: m.name, icon: m.icon, count: cm.count };
    });

    usePotionStore.getState().addRecord({
      materials: recordMaterials,
      temperatureCurve: temperatureLog,
      stirCount,
      resultPotionName: null,
      quality: null,
      success: false,
      failureReason: '酿造被手动取消',
    });

    set({
      isBrewing: false,
      progress: 0,
      cauldronMaterials: [],
      stirCount: 0,
      temperatureLog: [],
    });
  },

  tickProgress: () => {
    const state = get();
    if (!state.isBrewing) return;

    const { cauldronMaterials, materials, temperature } = state;

    for (const cm of cauldronMaterials) {
      const m = materials.find((mat) => mat.id === cm.materialId);
      if (m && (temperature < m.tempMin || temperature > m.tempMax)) {
        get().triggerExplosion();
        return;
      }
    }

    const tempFactor = temperature / 150;
    const stirFactor = 1 + state.stirCount * 0.02;
    const increment = Math.min(8, tempFactor * stirFactor * 2);
    const newProgress = Math.min(100, state.progress + increment);

    if (newProgress >= 100) {
      const avgTemp =
        state.temperatureLog.reduce((a, b) => a + b, 0) /
        state.temperatureLog.length;
      const usedMaterials = cauldronMaterials.map((cm) =>
        materials.find((m) => m.id === cm.materialId)!
      );
      const allMaterialIds = cauldronMaterials.flatMap((cm) =>
        Array(cm.count).fill(cm.materialId)
      );

      const potionBase = determinePotion(_.uniq(allMaterialIds));
      const quality = calculateQuality(usedMaterials, avgTemp, state.stirCount);
      const powerMultiplier = quality === 'perfect' ? 2 : quality === 'good' ? 1.5 : 1;

      if (potionBase) {
        const newPotion: Omit<Potion, 'id' | 'createdAt'> = {
          name: potionBase.name,
          type: potionBase.type,
          quality,
          icon: potionBase.icon,
          effect: potionBase.effect,
          power: Math.round(50 * powerMultiplier),
        };

        usePotionStore.getState().addPotion(newPotion);

        set((s) => ({
          materials: s.materials.map((m) => {
            const used = s.cauldronMaterials.find(
              (cm) => cm.materialId === m.id
            );
            return used ? { ...m, count: m.count - used.count } : m;
          }),
        }));

        const recordMaterials = cauldronMaterials.map((cm) => {
          const m = materials.find((mat) => mat.id === cm.materialId)!;
          return { name: m.name, icon: m.icon, count: cm.count };
        });

        usePotionStore.getState().addRecord({
          materials: recordMaterials,
          temperatureCurve: state.temperatureLog,
          stirCount: state.stirCount,
          resultPotionName: potionBase.name,
          quality,
          success: true,
        });
      }

      set({
        isBrewing: false,
        progress: 100,
        cauldronMaterials: [],
        stirCount: 0,
        temperatureLog: [],
      });

      setTimeout(() => {
        set({ progress: 0 });
      }, 1500);
    } else {
      set({
        progress: newProgress,
        temperatureLog: [...state.temperatureLog, temperature],
      });
    }
  },

  resetCauldron: () => {
    set({
      cauldronMaterials: [],
      stirCount: 0,
      progress: 0,
      isBrewing: false,
      temperatureLog: [],
      isExploding: false,
    });
  },

  triggerExplosion: () => {
    const { cauldronMaterials, temperatureLog, stirCount, materials } = get();

    const recordMaterials = cauldronMaterials.map((cm) => {
      const m = materials.find((mat) => mat.id === cm.materialId)!;
      return { name: m.name, icon: m.icon, count: cm.count };
    });

    usePotionStore.getState().addRecord({
      materials: recordMaterials,
      temperatureCurve: temperatureLog,
      stirCount,
      resultPotionName: null,
      quality: null,
      success: false,
      failureReason: '温度超出材料耐受范围，发生爆炸！',
    });

    set({
      isExploding: true,
      isBrewing: false,
      progress: 0,
    });

    setTimeout(() => {
      set({
        isExploding: false,
        cauldronMaterials: [],
        stirCount: 0,
        temperatureLog: [],
      });
    }, 500);
  },

  setActiveEffect: (effect) => {
    set({ activeEffect: effect });
    if (effect) {
      setTimeout(() => set({ activeEffect: null }), 1500);
    }
  },
}));
