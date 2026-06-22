import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Block,
  AnimationSequence,
  PreviewState,
  ShapePaletteItem,
  AnimationPaletteItem,
  ShapeParams,
  AnimationParams,
  MAX_SHAPES,
  MAX_ANIMATIONS_PER_SHAPE
} from './types';

interface ToastState {
  message: string;
  visible: boolean;
}

interface AnimStore {
  blocks: Block[];
  sequences: AnimationSequence[];
  preview: PreviewState;
  toasts: ToastState[];
  expandedBlocks: Set<string>;

  addShapeBlock: (item: ShapePaletteItem, initialX?: number, initialY?: number) => Block | null;
  addAnimationBlock: (item: AnimationPaletteItem, shapeId: string, position?: number) => Block | null;
  updateBlockParams: (blockId: string, params: Partial<ShapeParams | AnimationParams>) => void;
  deleteBlock: (blockId: string) => void;
  reorderAnimation: (shapeId: string, fromIndex: number, toIndex: number) => void;
  setPreview: (state: Partial<PreviewState>) => void;
  toggleBlockExpanded: (blockId: string) => void;
  showToast: (message: string, duration?: number) => void;
  canAddShape: () => boolean;
  canAddAnimation: (shapeId: string) => boolean;
  getShapeAnimations: (shapeId: string) => Block[];
}

export const useAnimStore = create<AnimStore>((set, get) => ({
  blocks: [],
  sequences: [],
  preview: {
    isPlaying: false,
    currentTime: 0,
    speed: 1,
    fps: 60
  },
  toasts: [],
  expandedBlocks: new Set(),

  canAddShape: () => {
    const state = get();
    const shapeCount = state.blocks.filter(b => b.type === 'shape').length;
    return shapeCount < MAX_SHAPES;
  },

  canAddAnimation: (shapeId: string) => {
    const state = get();
    const seq = state.sequences.find(s => s.shapeId === shapeId);
    const count = seq ? seq.animationIds.length : 0;
    return count < MAX_ANIMATIONS_PER_SHAPE;
  },

  getShapeAnimations: (shapeId: string) => {
    const state = get();
    const seq = state.sequences.find(s => s.shapeId === shapeId);
    if (!seq) return [];
    return seq.animationIds
      .map(id => state.blocks.find(b => b.id === id))
      .filter((b): b is Block => b !== undefined);
  },

  addShapeBlock: (item, initialX, initialY) => {
    const state = get();
    if (!state.canAddShape()) {
      state.showToast(`已达形状上限（最多${MAX_SHAPES}个）`);
      return null;
    }

    const shapeCount = state.blocks.filter(b => b.type === 'shape').length;
    const id = uuidv4();
    const baseX = 200 + (shapeCount % 3) * 80;
    const baseY = 150 + Math.floor(shapeCount / 3) * 80;

    const block: Block = {
      id,
      type: 'shape',
      shapeType: item.shapeType,
      name: item.name,
      icon: item.icon,
      params: {
        ...item.defaultParams,
        ...(initialX !== undefined && { _initialX: initialX } as any),
        ...(initialY !== undefined && { _initialY: initialY } as any),
        _baseX: initialX !== undefined ? initialX : baseX,
        _baseY: initialY !== undefined ? initialY : baseY
      } as ShapeParams
    };

    set(s => ({
      blocks: [...s.blocks, block],
      sequences: [...s.sequences, { shapeId: id, animationIds: [] }]
    }));

    return block;
  },

  addAnimationBlock: (item, shapeId, position) => {
    const state = get();
    if (!state.canAddAnimation(shapeId)) {
      state.showToast(`已达动画上限（每个形状最多${MAX_ANIMATIONS_PER_SHAPE}个）`);
      return null;
    }

    const id = uuidv4();
    const block: Block = {
      id,
      type: 'animation',
      animationType: item.animationType,
      name: item.name,
      icon: item.icon,
      params: { ...item.defaultParams },
      parentShapeId: shapeId
    };

    set(s => {
      const newSequences = s.sequences.map(seq => {
        if (seq.shapeId !== shapeId) return seq;
        const newIds = [...seq.animationIds];
        if (position !== undefined && position >= 0 && position <= newIds.length) {
          newIds.splice(position, 0, id);
        } else {
          newIds.push(id);
        }
        return { ...seq, animationIds: newIds };
      });
      return {
        blocks: [...s.blocks, block],
        sequences: newSequences
      };
    });

    return block;
  },

  updateBlockParams: (blockId, params) => {
    set(s => ({
      blocks: s.blocks.map(b =>
        b.id === blockId ? { ...b, params: { ...b.params, ...params } } : b
      )
    }));
  },

  deleteBlock: (blockId) => {
    set(s => {
      const block = s.blocks.find(b => b.id === blockId);
      if (!block) return s;

      if (block.type === 'shape') {
        const seq = s.sequences.find(sq => sq.shapeId === blockId);
        const animIdsToDelete = seq ? seq.animationIds : [];
        return {
          blocks: s.blocks.filter(b => b.id !== blockId && !animIdsToDelete.includes(b.id)),
          sequences: s.sequences.filter(sq => sq.shapeId !== blockId)
        };
      } else if (block.type === 'animation') {
        return {
          blocks: s.blocks.filter(b => b.id !== blockId),
          sequences: s.sequences.map(seq => ({
            ...seq,
            animationIds: seq.animationIds.filter(id => id !== blockId)
          }))
        };
      }
      return s;
    });
  },

  reorderAnimation: (shapeId, fromIndex, toIndex) => {
    set(s => ({
      sequences: s.sequences.map(seq => {
        if (seq.shapeId !== shapeId) return seq;
        const newIds = [...seq.animationIds];
        const [moved] = newIds.splice(fromIndex, 1);
        newIds.splice(toIndex, 0, moved);
        return { ...seq, animationIds: newIds };
      })
    }));
  },

  setPreview: (statePartial) => {
    set(s => ({
      preview: { ...s.preview, ...statePartial }
    }));
  },

  toggleBlockExpanded: (blockId) => {
    set(s => {
      const newSet = new Set(s.expandedBlocks);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return { expandedBlocks: newSet };
    });
  },

  showToast: (message, duration = 2000) => {
    const toastId = uuidv4();
    set(s => ({
      toasts: [...s.toasts, { message, visible: true }]
    }));

    setTimeout(() => {
      set(s => ({
        toasts: s.toasts.slice(1)
      }));
    }, duration);
  }
}));
