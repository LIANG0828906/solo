// ============================================================
// Zustand全局状态管理
// 职责: 维护合成相关的全局状态（材料列表、已选槽位、预览结果、历史记录）
// 被调用: useCrafting钩子通过setter更新状态，各组件通过selector读取
// 数据流向: craftingApi返回 -> store更新 -> 所有订阅组件re-render
// ============================================================

import { create } from 'zustand';
import type {
  Material,
  Equipment,
  CraftingPreview,
  CraftingHistoryItem,
  CraftingResult,
} from '../types';

interface CraftingState {
  // ============== 基础数据 ==============
  materials: Material[];                          // 所有可用材料 - 由fetchMaterials填充
  equipmentList: Equipment[];                     // 所有装备列表
  currentEquipment: Equipment | null;             // 当前选中要合成的装备

  // ============== 合成槽位状态 ==============
  // 长度为3的数组，null代表空槽位 - CraftingSlot组件按index渲染
  selectedMaterials: (Material | null)[];         // [mat1, mat2|null, mat3|null]

  // ============== 预览与结果 ==============
  preview: CraftingPreview | null;                // 实时预计算结果 - SuccessRateCircle读取
  lastResult: CraftingResult | null;              // 最近一次合成结果 - EquipmentViewer特效触发
  isCrafting: boolean;                            // 合成中loading状态

  // ============== 历史记录 ==============
  // 最多保留10条，新的插入头部 - CraftingHistory组件渲染
  history: CraftingHistoryItem[];

  // ============== 操作方法 ==============
  setMaterials: (list: Material[]) => void;
  setEquipmentList: (list: Equipment[]) => void;
  setCurrentEquipment: (eq: Equipment) => void;

  // 槽位操作 - CraftingSlot通过useCrafting调用
  setMaterialAtSlot: (index: number, material: Material | null) => void;
  swapSlots: (from: number, to: number) => void;           // 拖拽排序
  addMaterial: (material: Material) => boolean;            // 点击卡片添加
  removeMaterial: (index: number) => void;                 // 移除槽位材料
  clearAllSlots: () => void;                               // 重置按钮

  setPreview: (p: CraftingPreview | null) => void;
  setLastResult: (r: CraftingResult | null) => void;
  setIsCrafting: (b: boolean) => void;

  addHistory: (item: CraftingHistoryItem) => void;         // 合成完成后调用
  loadHistoryToSlots: (itemId: string) => void;            // 点击历史记录重加载
}

const MAX_HISTORY = 10;
const MAX_SLOTS = 3;

export const useCraftingStore = create<CraftingState>((set, get) => ({
  materials: [],
  equipmentList: [],
  currentEquipment: null,
  selectedMaterials: [null, null, null],
  preview: null,
  lastResult: null,
  isCrafting: false,
  history: [],

  setMaterials: (list) => set({ materials: list }),
  setEquipmentList: (list) => set({ equipmentList: list, currentEquipment: list[0] ?? null }),
  setCurrentEquipment: (eq) => set({ currentEquipment: eq }),

  // ============== 槽位操作核心方法 ==============
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
    // 不允许重复添加同一材料
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

  // ============== 历史记录操作 ==============
  addHistory: (item) => {
    set((state) => ({
      history: [item, ...state.history].slice(0, MAX_HISTORY), // 新记录插入头部，截断10条
    }));
  },

  // 点击历史记录 -> 材料恢复到槽位
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
}));
