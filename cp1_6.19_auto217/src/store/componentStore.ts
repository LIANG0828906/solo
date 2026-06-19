import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type Category = 'head' | 'torso' | 'limbs' | 'accessories';

export interface ComponentItem {
  id: string;
  name: string;
  category: Category;
  color: string;
  width: number;
  height: number;
  shape: string;
}

export interface CanvasComponent {
  id: string;
  componentId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  color: string;
}

export interface PoseComponentDef {
  category: Category;
  subIndex: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface PoseTemplate {
  id: string;
  name: string;
  emoji: string;
  components: PoseComponentDef[];
}

export interface EditingComponent {
  id: string;
  color: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

interface ComponentStore {
  componentLibrary: ComponentItem[];
  canvasComponents: CanvasComponent[];
  poseTemplates: PoseTemplate[];
  currentPoseId: string | null;
  editingComponent: EditingComponent | null;
  editModalOpen: boolean;

  addComponentToCanvas: (item: ComponentItem, x: number, y: number) => void;
  updateCanvasComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  removeCanvasComponent: (id: string) => void;
  applyPose: (poseId: string) => void;
  randomInspiration: () => void;
  openEditModal: (comp: CanvasComponent) => void;
  closeEditModal: () => void;
  updateEditingColor: (color: string) => void;
  updateEditingRotation: (rotation: number) => void;
  toggleEditingFlipH: () => void;
  toggleEditingFlipV: () => void;
  saveEditingToLibrary: () => void;
  applyEditingToCanvas: () => void;
  updateComponentInLibrary: (id: string, color: string) => void;
  importCharacter: (data: string) => void;
}

const defaultComponents: ComponentItem[] = [
  { id: 'head-1', name: '圆脸', category: 'head', color: '#FFD5B8', width: 60, height: 60, shape: 'circle-face' },
  { id: 'head-2', name: '方脸', category: 'head', color: '#FFD5B8', width: 60, height: 65, shape: 'square-face' },
  { id: 'head-3', name: '猫耳头', category: 'head', color: '#FFD5B8', width: 70, height: 75, shape: 'cat-ear' },
  { id: 'head-4', name: '尖脸', category: 'head', color: '#F5C5A3', width: 55, height: 65, shape: 'pointed-face' },

  { id: 'torso-1', name: '标准躯干', category: 'torso', color: '#5B8DEF', width: 65, height: 90, shape: 'standard-torso' },
  { id: 'torso-2', name: '运动上衣', category: 'torso', color: '#FF6B6B', width: 70, height: 90, shape: 'sport-torso' },
  { id: 'torso-3', name: '连衣裙', category: 'torso', color: '#B388FF', width: 75, height: 110, shape: 'dress-torso' },
  { id: 'torso-4', name: '西装', category: 'torso', color: '#2C3E50', width: 70, height: 95, shape: 'suit-torso' },

  { id: 'limbs-1', name: '自然手臂', category: 'limbs', color: '#FFD5B8', width: 120, height: 35, shape: 'natural-arms' },
  { id: 'limbs-2', name: '标准双腿', category: 'limbs', color: '#3D5A80', width: 55, height: 100, shape: 'standard-legs' },
  { id: 'limbs-3', name: '伸展手臂', category: 'limbs', color: '#FFD5B8', width: 150, height: 30, shape: 'spread-arms' },
  { id: 'limbs-4', name: '跑步双腿', category: 'limbs', color: '#3D5A80', width: 65, height: 100, shape: 'running-legs' },
  { id: 'limbs-5', name: '叉腰手臂', category: 'limbs', color: '#FFD5B8', width: 110, height: 45, shape: 'akimbo-arms' },

  { id: 'acc-1', name: '帽子', category: 'accessories', color: '#FF6B6B', width: 65, height: 25, shape: 'hat' },
  { id: 'acc-2', name: '围巾', category: 'accessories', color: '#4ECDC4', width: 50, height: 28, shape: 'scarf' },
  { id: 'acc-3', name: '眼镜', category: 'accessories', color: '#333333', width: 48, height: 20, shape: 'glasses' },
  { id: 'acc-4', name: '蝴蝶结', category: 'accessories', color: '#FF69B4', width: 40, height: 30, shape: 'bow' },
];

const defaultPoses: PoseTemplate[] = [
  {
    id: 'pose-stand',
    name: '正常站立',
    emoji: '🧍',
    components: [
      { category: 'head', subIndex: 0, x: 165, y: 20, scale: 1, rotation: 0 },
      { category: 'torso', subIndex: 0, x: 162, y: 90, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 0, x: 135, y: 115, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 1, x: 167, y: 210, scale: 1, rotation: 0 },
    ],
  },
  {
    id: 'pose-wave',
    name: '挥手',
    emoji: '👋',
    components: [
      { category: 'head', subIndex: 0, x: 165, y: 20, scale: 1, rotation: -10 },
      { category: 'torso', subIndex: 0, x: 162, y: 90, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 0, x: 130, y: 105, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 1, x: 167, y: 210, scale: 1, rotation: 0 },
    ],
  },
  {
    id: 'pose-jump',
    name: '跳跃',
    emoji: '🦘',
    components: [
      { category: 'head', subIndex: 0, x: 165, y: 0, scale: 1, rotation: 0 },
      { category: 'torso', subIndex: 0, x: 162, y: 70, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 2, x: 120, y: 85, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 3, x: 162, y: 185, scale: 1, rotation: 0 },
    ],
  },
  {
    id: 'pose-surprise',
    name: '惊讶表情',
    emoji: '😲',
    components: [
      { category: 'head', subIndex: 0, x: 165, y: 15, scale: 1.1, rotation: 0 },
      { category: 'torso', subIndex: 0, x: 162, y: 90, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 2, x: 120, y: 100, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 1, x: 167, y: 210, scale: 1, rotation: 0 },
    ],
  },
  {
    id: 'pose-think',
    name: '思考',
    emoji: '🤔',
    components: [
      { category: 'head', subIndex: 0, x: 165, y: 20, scale: 1, rotation: 8 },
      { category: 'torso', subIndex: 0, x: 162, y: 90, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 4, x: 140, y: 110, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 1, x: 167, y: 210, scale: 1, rotation: 0 },
    ],
  },
  {
    id: 'pose-run',
    name: '奔跑',
    emoji: '🏃',
    components: [
      { category: 'head', subIndex: 0, x: 170, y: 25, scale: 1, rotation: -5 },
      { category: 'torso', subIndex: 0, x: 167, y: 90, scale: 1, rotation: -8 },
      { category: 'limbs', subIndex: 2, x: 120, y: 95, scale: 1, rotation: 0 },
      { category: 'limbs', subIndex: 3, x: 162, y: 185, scale: 1, rotation: 0 },
    ],
  },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

function getComponentsByCategory(
  canvasComponents: CanvasComponent[],
  componentLibrary: ComponentItem[],
  category: Category
): CanvasComponent[] {
  return canvasComponents.filter((cc) => {
    const item = componentLibrary.find((ci) => ci.id === cc.componentId);
    return item?.category === category;
  });
}

export const useComponentStore = create<ComponentStore>((set, get) => ({
  componentLibrary: loadFromStorage('cw-library', defaultComponents),
  canvasComponents: [],
  poseTemplates: defaultPoses,
  currentPoseId: null,
  editingComponent: null,
  editModalOpen: false,

  addComponentToCanvas: (item, x, y) => {
    const newComp: CanvasComponent = {
      id: uuidv4(),
      componentId: item.id,
      x,
      y,
      scale: 1,
      rotation: 0,
      flipH: false,
      flipV: false,
      color: item.color,
    };
    set((state) => ({
      canvasComponents: [...state.canvasComponents, newComp],
    }));
  },

  updateCanvasComponent: (id, updates) => {
    set((state) => ({
      canvasComponents: state.canvasComponents.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  removeCanvasComponent: (id) => {
    set((state) => ({
      canvasComponents: state.canvasComponents.filter((c) => c.id !== id),
    }));
  },

  applyPose: (poseId) => {
    const state = get();
    const pose = state.poseTemplates.find((p) => p.id === poseId);
    if (!pose) return;

    const updated = state.canvasComponents.map((cc) => {
      const item = state.componentLibrary.find((ci) => ci.id === cc.componentId);
      if (!item) return cc;

      const categoryComps = getComponentsByCategory(
        state.canvasComponents,
        state.componentLibrary,
        item.category
      );
      const subIndex = categoryComps.findIndex((c) => c.id === cc.id);
      if (subIndex === -1) return cc;

      const poseDef = pose.components.find(
        (pc) => pc.category === item.category && pc.subIndex === subIndex
      );
      if (!poseDef) return cc;

      return {
        ...cc,
        x: poseDef.x,
        y: poseDef.y,
        scale: poseDef.scale,
        rotation: poseDef.rotation,
      };
    });

    set({ canvasComponents: updated, currentPoseId: poseId });
  },

  randomInspiration: () => {
    const state = get();
    const categories: Category[] = ['head', 'torso', 'limbs', 'accessories'];
    const newCanvasComps: CanvasComponent[] = [];

    const baseY: Record<Category, number> = {
      head: 30,
      torso: 110,
      limbs: 100,
      accessories: 10,
    };

    categories.forEach((cat) => {
      const catItems = state.componentLibrary.filter((ci) => ci.category === cat);
      if (catItems.length === 0) return;

      const count = cat === 'limbs' ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const item = catItems[Math.floor(Math.random() * catItems.length)];
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 15;
        newCanvasComps.push({
          id: uuidv4(),
          componentId: item.id,
          x: 165 + offsetX,
          y: baseY[cat] + i * 110 + offsetY,
          scale: 0.8 + Math.random() * 0.4,
          rotation: (Math.random() - 0.5) * 20,
          flipH: Math.random() > 0.8,
          flipV: false,
          color: item.color,
        });
      }
    });

    const randomPoseIndex = Math.floor(Math.random() * state.poseTemplates.length);
    const randomPose = state.poseTemplates[randomPoseIndex];

    const alignedComps = newCanvasComps.map((cc) => {
      const item = state.componentLibrary.find((ci) => ci.id === cc.componentId);
      if (!item) return cc;
      const catComps = newCanvasComps.filter((nc) => {
        const ni = state.componentLibrary.find((ci) => ci.id === nc.componentId);
        return ni?.category === item.category;
      });
      const subIdx = catComps.findIndex((c) => c.id === cc.id);
      const poseDef = randomPose.components.find(
        (pc) => pc.category === item.category && pc.subIndex === subIdx
      );
      if (poseDef) {
        return { ...cc, x: poseDef.x, y: poseDef.y, scale: poseDef.scale, rotation: poseDef.rotation };
      }
      return cc;
    });

    set({
      canvasComponents: alignedComps,
      currentPoseId: randomPose.id,
    });
  },

  openEditModal: (comp) => {
    set({
      editingComponent: {
        id: comp.id,
        color: comp.color,
        rotation: comp.rotation,
        flipH: comp.flipH,
        flipV: comp.flipV,
      },
      editModalOpen: true,
    });
  },

  closeEditModal: () => {
    set({ editingComponent: null, editModalOpen: false });
  },

  updateEditingColor: (color) => {
    set((state) => ({
      editingComponent: state.editingComponent
        ? { ...state.editingComponent, color }
        : null,
    }));
  },

  updateEditingRotation: (rotation) => {
    set((state) => ({
      editingComponent: state.editingComponent
        ? { ...state.editingComponent, rotation }
        : null,
    }));
  },

  toggleEditingFlipH: () => {
    set((state) => ({
      editingComponent: state.editingComponent
        ? { ...state.editingComponent, flipH: !state.editingComponent.flipH }
        : null,
    }));
  },

  toggleEditingFlipV: () => {
    set((state) => ({
      editingComponent: state.editingComponent
        ? { ...state.editingComponent, flipV: !state.editingComponent.flipV }
        : null,
    }));
  },

  saveEditingToLibrary: () => {
    const state = get();
    if (!state.editingComponent) return;

    const canvasComp = state.canvasComponents.find(
      (c) => c.id === state.editingComponent!.id
    );
    if (!canvasComp) return;

    const libItem = state.componentLibrary.find(
      (ci) => ci.id === canvasComp.componentId
    );
    if (libItem) {
      const updatedLib = state.componentLibrary.map((ci) =>
        ci.id === libItem.id ? { ...ci, color: state.editingComponent!.color } : ci
      );
      saveToStorage('cw-library', updatedLib);
      set({ componentLibrary: updatedLib });
    }

    const updatedCanvas = state.canvasComponents.map((c) =>
      c.id === state.editingComponent!.id
        ? {
            ...c,
            color: state.editingComponent!.color,
            rotation: state.editingComponent!.rotation,
            flipH: state.editingComponent!.flipH,
            flipV: state.editingComponent!.flipV,
          }
        : c
    );
    set({ canvasComponents: updatedCanvas });
  },

  applyEditingToCanvas: () => {
    const state = get();
    if (!state.editingComponent) return;
    const updatedCanvas = state.canvasComponents.map((c) =>
      c.id === state.editingComponent!.id
        ? {
            ...c,
            color: state.editingComponent!.color,
            rotation: state.editingComponent!.rotation,
            flipH: state.editingComponent!.flipH,
            flipV: state.editingComponent!.flipV,
          }
        : c
    );
    set({ canvasComponents: updatedCanvas });
  },

  updateComponentInLibrary: (id, color) => {
    set((state) => {
      const updatedLib = state.componentLibrary.map((ci) =>
        ci.id === id ? { ...ci, color } : ci
      );
      saveToStorage('cw-library', updatedLib);
      return { componentLibrary: updatedLib };
    });
  },

  importCharacter: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.canvasComponents) {
        set({ canvasComponents: parsed.canvasComponents });
      }
      if (parsed.componentLibrary) {
        set({ componentLibrary: parsed.componentLibrary });
        saveToStorage('cw-library', parsed.componentLibrary);
      }
    } catch { /* ignore invalid JSON */ }
  },
}));
