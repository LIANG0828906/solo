import { create } from 'zustand';
import { ExplosionState } from '@/types';
import { BRONZE_DING_PARTS, MAX_SELECTED_PARTS } from '@/utils/modelData';
import { easeOutExpo } from '@/utils/easing';

/**
 * Zustand 全局状态管理模块
 *
 * 职责：管理拆解偏移、选中部件、自动旋转等全局状态，以及动画逻辑。
 *
 * 调用方：
 *   - ExplosionPanel 读取 partOffsets/autoRotate/isAnimating/selectedCount，
 *     调用 setPartOffset/toggleAutoRotate/explodeAll/resetAll
 *   - Scene 读取 partOffsets/selectedParts/autoRotate，驱动部件渲染
 *   - PartMesh 调用 togglePartSelection 处理点击选中
 *
 * 数据流向：
 *   用户交互 → ExplosionPanel/PartMesh → action(setPartOffset等) →
 *   store 更新 state → Scene/PartMesh 订阅变化 → 3D 场景重绘
 *
 * 选中计数逻辑：
 *   不使用冗余 selectedCount 字段，直接通过 selectedParts.length 判断。
 *   取消选中时 filter 移除，添加选中时若已满则忽略。
 *   从根上避免计数器与数组长度不同步的问题。
 */

const initOffsets = (): Record<string, number> => {
  const offsets: Record<string, number> = {};
  BRONZE_DING_PARTS.forEach((p) => {
    offsets[p.id] = 0;
  });
  return offsets;
};

export const useExplosionStore = create<ExplosionState>((set, get) => ({
  partOffsets: initOffsets(),
  selectedParts: [],
  autoRotate: false,
  isAnimating: false,
  selectedCount: 0,

  setPartOffset: (partId: string, value: number) => {
    set((state) => ({
      partOffsets: { ...state.partOffsets, [partId]: value },
    }));
  },

  togglePartSelection: (partId: string) => {
    set((state) => {
      const exists = state.selectedParts.includes(partId);
      if (exists) {
        const next = state.selectedParts.filter((id) => id !== partId);
        return {
          selectedParts: next,
          selectedCount: next.length,
        };
      }
      if (state.selectedParts.length >= MAX_SELECTED_PARTS) {
        return state;
      }
      const next = [...state.selectedParts, partId];
      return {
        selectedParts: next,
        selectedCount: next.length,
      };
    });
  },

  toggleAutoRotate: () => {
    set((state) => ({ autoRotate: !state.autoRotate }));
  },

  explodeAll: async () => {
    const state = get();
    if (state.isAnimating) return;
    set({ isAnimating: true });

    const targets: Record<string, { start: number; end: number }> = {};
    BRONZE_DING_PARTS.forEach((p) => {
      targets[p.id] = {
        start: state.partOffsets[p.id] || 0,
        end: p.explodeTargetOffset,
      };
    });

    const EXPLODE_DURATION = 2000;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / EXPLODE_DURATION, 1);
        const eased = easeOutExpo(progress);
        const nextOffsets: Record<string, number> = {};
        BRONZE_DING_PARTS.forEach((p) => {
          const t = targets[p.id];
          nextOffsets[p.id] = t.start + (t.end - t.start) * eased;
        });
        set({ partOffsets: nextOffsets });
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });

    set({ isAnimating: false });
  },

  resetAll: async () => {
    const state = get();
    if (state.isAnimating) return;
    set({ isAnimating: true });

    const starts: Record<string, number> = { ...state.partOffsets };
    const RESET_DURATION = 1500;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / RESET_DURATION, 1);
        const eased = easeOutExpo(progress);
        const nextOffsets: Record<string, number> = {};
        BRONZE_DING_PARTS.forEach((p) => {
          nextOffsets[p.id] = starts[p.id] * (1 - eased);
        });
        set({ partOffsets: nextOffsets });
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });

    set({ isAnimating: false });
  },
}));
