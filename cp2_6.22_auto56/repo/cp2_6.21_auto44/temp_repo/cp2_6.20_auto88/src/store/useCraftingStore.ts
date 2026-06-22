// ============================================================
// Zustand全局状态管理
// 职责: 维护合成相关的全局状态（材料列表、收藏列表、已选槽位、预览结果、历史记录）
// 被调用: useCrafting钩子通过setter更新状态，各组件通过selector读取
// 数据流向: craftingApi返回 -> store更新(收藏排序) -> 所有订阅组件re-render
// 持久化: 收藏材料ID集合通过zustand/persist中间件持久化到localStorage
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Material,
  Equipment,
  CraftingPreview,
  CraftingHistoryItem,
  CraftingResult,
} from '../types';

interface CraftingState {
  // ============== 基础数据 ==============
  materials: Material[];
  equipmentList: Equipment[];
  currentEquipment: Equipment | null;

  // ============== 材料收藏 ==============
  // 收藏材料ID集合 - 由MaterialCard星标按钮切换，通过persist持久化
  favoriteMaterialIds: string[];

  // ============== 合成槽位状态 ==============
  selectedMaterials: (Material | null)[];

  // ============== 预览与结果 ==============
  preview: CraftingPreview | null;
  lastResult: CraftingResult | null;
  isCrafting: boolean;

  // ============== 历史记录 ==============
  history: CraftingHistoryItem[];

  // ============== 操作方法 ==============
  setMaterials: (list: Material[]) => void;
  setEquipmentList: (list: Equipment[]) => void;
  setCurrentEquipment: (eq: Equipment) => void;

  // 收藏操作 - MaterialCard星标按钮调用
  toggleFavorite: (materialId: string) => void;
  isFavorite: (materialId: string) => boolean;

  // 槽位操作
  setMaterialAtSlot: (index: number, material: Material | null) => void;
  swapSlots: (from: number, to: number) => void;
  addMaterial: (material: Material) => boolean;
  removeMaterial: (index: number) => void;
  clearAllSlots: () => void;

  setPreview: (p: CraftingPreview | null) => void;
  setLastResult: (r: CraftingResult | null) => void;
  setIsCrafting: (b: boolean) => void;

  addHistory: (item: CraftingHistoryItem) => void;
  loadHistoryToSlots: (itemId: string) => void;
}

const MAX_HISTORY = 10;
const MAX_SLOTS = 3;

// 对材料列表按收藏优先排序: 收藏的在前面，保持相对顺序
function sortMaterialsByFavorite(mats: Material[], favIds: string[]): Material[] {
  const favSet = new Set(favIds);
  return [...mats].sort((a, b) => {
    const aFav = favSet.has(a.id) ? 1 : 0;
    const bFav = favSet.has(b.id) ? 1 : 0;
    return bFav - aFav;
  });
}

export const useCraftingStore = create<CraftingState>()(
  persist(
    (set, get) => ({
      // ============== 初始状态 ==============
      materials: [],
      equipmentList: [],
      currentEquipment: null,
      favoriteMaterialIds: [],  // persist自动从localStorage恢复
      selectedMaterials: [null, null, null],
      preview: null,
      lastResult: null,
      isCrafting: false,
      history: [],

      // ============== 收藏操作核心方法 ==============
      // 切换收藏状态 -> 同时重排materials
      toggleFavorite: (materialId) => {
        set((state) => {
          const isFav = state.favoriteMaterialIds.includes(materialId);
          const newFavIds = isFav
            ? state.favoriteMaterialIds.filter((id) => id !== materialId)
            : [...state.favoriteMaterialIds, materialId];
          return {
            favoriteMaterialIds: newFavIds,
            materials: sortMaterialsByFavorite(state.materials, newFavIds),
          };
        });
      },

      isFavorite: (materialId) => get().favoriteMaterialIds.includes(materialId),

      // ============== 基础setters ==============
      // setMaterials时按收藏排序
      setMaterials: (list) =>
        set((state) => ({
          materials: sortMaterialsByFavorite(list, state.favoriteMaterialIds),
        })),

      setEquipmentList: (list) =>
        set({ equipmentList: list, currentEquipment: list[0] ?? null }),

      setCurrentEquipment: (eq) => set({ currentEquipment: eq }),

      // ============== 槽位操作 ==============
      setMaterialAtSlot: (index, material) => {
        if (index < 0 || index >= MAX_SLOTS) return;
        set((state) => {
          const newSlots = [...state.selectedMaterials];
          newSlots[index] = material;
          return { selectedMaterials: newSlots };
        });
      },

      swapSlots: (from, to) => {
        if (from < 0 || from >= MAX_SLOTS || to < 0 || to >= MAX_SLOTS) return;
        set((state) => {
          const newSlots = [...state.selectedMaterials];
          [newSlots[from], newSlots[to]] = [newSlots[to], newSlots[from]];
          return { selectedMaterials: newSlots };
        });
      },

      addMaterial: (material) => {
        const state = get();
        if (state.selectedMaterials.some((m) => m?.id === material.id)) return false;
        const emptyIdx = state.selectedMaterials.findIndex((m) => m === null);
        if (emptyIdx === -1) return false;
        get().setMaterialAtSlot(emptyIdx, material);
        return true;
      },

      removeMaterial: (index) => {
        get().setMaterialAtSlot(index, null);
      },

      clearAllSlots: () => {
        set({
          selectedMaterials: [null, null, null],
          preview: null,
          lastResult: null,
        });
      },

      setPreview: (p) => set({ preview: p }),
      setLastResult: (r) => set({ lastResult: r }),
      setIsCrafting: (b) => set({ isCrafting: b }),

      // ============== 历史记录 ==============
      addHistory: (item) => {
        set((state) => ({
          history: [item, ...state.history].slice(0, MAX_HISTORY),
        }));
      },

      loadHistoryToSlots: (itemId) => {
        const state = get();
        const item = state.history.find((h) => h.id === itemId);
        if (!item) return;
        const newSlots: (Material | null)[] = [null, null, null];
        item.materials.forEach((mat, idx) => {
          if (idx < MAX_SLOTS) newSlots[idx] = mat;
        });
        const eq = state.equipmentList.find((e) => e.id === item.equipmentId);
        set({
          selectedMaterials: newSlots,
          currentEquipment: eq ?? state.currentEquipment,
          lastResult: null,
        });
      },
    }),
    {
      // persist配置: 只持久化favoriteMaterialIds到localStorage
      name: 'crafting-store-v1',
      partialize: (state) => ({
        favoriteMaterialIds: state.favoriteMaterialIds,
      }),
      // hydrate时也要按已加载的收藏ID重排材料
      onRehydrateStorage: () => (state) => {
        if (state && state.materials.length > 0 && state.favoriteMaterialIds.length > 0) {
          state.materials = sortMaterialsByFavorite(state.materials, state.favoriteMaterialIds);
        }
      },
    },
  ),
);
