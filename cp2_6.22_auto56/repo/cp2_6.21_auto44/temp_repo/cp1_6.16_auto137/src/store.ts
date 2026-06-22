import { create } from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

export type MaterialType = 'character' | 'scene' | 'prop';

export interface Material {
  id: string;
  type: MaterialType;
  name: string;
  imageUrl: string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface CanvasElement {
  id: string;
  materialId: string;
  type: MaterialType;
  imageUrl: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  flipped: boolean;
  zIndex: number;
}

interface PosterState {
  materials: Material[];
  elements: CanvasElement[];
  selectedId: string | null;
  history: CanvasElement[][];
  historyIndex: number;
  maxHistory: number;
  nextZIndex: number;

  addElement: (materialId: string, x: number, y: number) => void;
  removeElement: (id: string) => void;
  moveElement: (id: string, x: number, y: number) => void;
  scaleElement: (id: string, delta: number) => void;
  flipElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  pushHistory: () => void;
}

const materials: Material[] = [
  { id: 'c1', type: 'character', name: '牛仔英雄', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20western%20cowboy%20character%20silhouette%20with%20hat%20png%20transparent%20background&image_size=square', defaultWidth: 180, defaultHeight: 280 },
  { id: 'c2', type: 'character', name: '神秘侦探', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20detective%20character%20with%20trench%20coat%20and%20hat%20noir%20style%20png%20transparent&image_size=square', defaultWidth: 160, defaultHeight: 260 },
  { id: 'c3', type: 'character', name: '科幻战士', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci-fi%20warrior%20character%20futuristic%20armor%20png%20transparent%20background&image_size=square', defaultWidth: 170, defaultHeight: 270 },
  { id: 'c4', type: 'character', name: '复古女星', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20hollywood%20actress%20vintage%20style%20portrait%20png%20transparent&image_size=square', defaultWidth: 150, defaultHeight: 240 },
  { id: 'c5', type: 'character', name: '恐怖怪物', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20horror%20monster%20creature%20silhouette%20png%20transparent%20background&image_size=square', defaultWidth: 200, defaultHeight: 280 },
  { id: 'c6', type: 'character', name: '浪漫主角', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20movie%20hero%20character%20elegant%20pose%20png%20transparent&image_size=square', defaultWidth: 160, defaultHeight: 260 },

  { id: 's1', type: 'scene', name: '城市夜景', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20noir%20city%20skyline%20at%20night%20movie%20poster%20background&image_size=portrait_4_3', defaultWidth: 700, defaultHeight: 500 },
  { id: 's2', type: 'scene', name: '沙漠荒野', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=western%20desert%20landscape%20wild%20west%20movie%20scene&image_size=portrait_4_3', defaultWidth: 700, defaultHeight: 500 },
  { id: 's3', type: 'scene', name: '太空星际', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=deep%20space%20galaxy%20stars%20sci-fi%20movie%20background&image_size=portrait_4_3', defaultWidth: 700, defaultHeight: 500 },
  { id: 's4', type: 'scene', name: '古堡阴森', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=haunted%20castle%20dark%20gothic%20horror%20movie%20scene&image_size=portrait_4_3', defaultWidth: 700, defaultHeight: 500 },
  { id: 's5', type: 'scene', name: '浪漫街头', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20city%20street%20sunset%20romance%20movie%20background&image_size=portrait_4_3', defaultWidth: 700, defaultHeight: 500 },
  { id: 's6', type: 'scene', name: '森林迷雾', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=misty%20forest%20fantasy%20movie%20scene%20atmospheric&image_size=portrait_4_3', defaultWidth: 700, defaultHeight: 500 },

  { id: 'p1', type: 'prop', name: '左轮手枪', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20revolver%20gun%20western%20movie%20prop%20png%20transparent&image_size=square', defaultWidth: 100, defaultHeight: 70 },
  { id: 'p2', type: 'prop', name: '放大镜', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20magnifying%20glass%20detective%20prop%20png%20transparent%20background&image_size=square', defaultWidth: 80, defaultHeight: 100 },
  { id: 'p3', type: 'prop', name: '光剑', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=glowing%20lightsaber%20sci-fi%20weapon%20png%20transparent%20background&image_size=square', defaultWidth: 60, defaultHeight: 200 },
  { id: 'p4', type: 'prop', name: '玫瑰花朵', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=single%20red%20rose%20romantic%20movie%20prop%20png%20transparent&image_size=square', defaultWidth: 70, defaultHeight: 100 },
  { id: 'p5', type: 'prop', name: '魔法药水', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=magic%20potion%20bottle%20fantasy%20movie%20prop%20glowing%20png%20transparent&image_size=square', defaultWidth: 60, defaultHeight: 90 },
  { id: 'p6', type: 'prop', name: '骷髅头', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=human%20skull%20horror%20movie%20prop%20png%20transparent%20background&image_size=square', defaultWidth: 80, defaultHeight: 90 },
];

export const usePosterStore = create<PosterState>((set, get) => ({
  materials,
  elements: [],
  selectedId: null,
  history: [[]],
  historyIndex: 0,
  maxHistory: 30,
  nextZIndex: 1,

  addElement: (materialId, x, y) => {
    const material = get().materials.find(m => m.id === materialId);
    if (!material) return;

    const newElement: CanvasElement = {
      id: uuidv4(),
      materialId: material.id,
      type: material.type,
      imageUrl: material.imageUrl,
      name: material.name,
      x: x - material.defaultWidth / 2,
      y: y - material.defaultHeight / 2,
      width: material.defaultWidth,
      height: material.defaultHeight,
      scale: 1,
      flipped: false,
      zIndex: get().nextZIndex,
    };

    set(state => ({
      elements: [...state.elements, newElement],
      selectedId: newElement.id,
      nextZIndex: state.nextZIndex + 1,
    }));
    get().pushHistory();
  },

  removeElement: (id) => {
    set(state => ({
      elements: state.elements.filter(el => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
    get().pushHistory();
  },

  moveElement: (id, x, y) => {
    set(produce<PosterState>(state => {
      const element = state.elements.find(el => el.id === id);
      if (element) {
        element.x = x;
        element.y = y;
      }
    }));
  },

  scaleElement: (id, delta) => {
    set(produce<PosterState>(state => {
      const element = state.elements.find(el => el.id === id);
      if (element) {
        const newScale = Math.max(0.2, Math.min(5, element.scale + delta));
        const prevWidth = element.width * element.scale;
        const prevHeight = element.height * element.scale;
        const newWidth = element.width * newScale;
        const newHeight = element.height * newScale;
        element.x += (prevWidth - newWidth) / 2;
        element.y += (prevHeight - newHeight) / 2;
        element.scale = newScale;
      }
    }));
  },

  flipElement: (id) => {
    set(produce<PosterState>(state => {
      const element = state.elements.find(el => el.id === id);
      if (element) {
        element.flipped = !element.flipped;
      }
    }));
    get().pushHistory();
  },

  selectElement: (id) => {
    set({ selectedId: id });
  },

  bringForward: (id) => {
    set(produce<PosterState>(state => {
      const sorted = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
      const index = sorted.findIndex(el => el.id === id);
      if (index < sorted.length - 1) {
        const nextZ = sorted[index + 1].zIndex;
        sorted[index + 1].zIndex = sorted[index].zIndex;
        sorted[index].zIndex = nextZ;
      }
    }));
    get().pushHistory();
  },

  sendBackward: (id) => {
    set(produce<PosterState>(state => {
      const sorted = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
      const index = sorted.findIndex(el => el.id === id);
      if (index > 0) {
        const prevZ = sorted[index - 1].zIndex;
        sorted[index - 1].zIndex = sorted[index].zIndex;
        sorted[index].zIndex = prevZ;
      }
    }));
    get().pushHistory();
  },

  bringToFront: (id) => {
    const maxZ = Math.max(...get().elements.map(el => el.zIndex), 0);
    set(produce<PosterState>(state => {
      const element = state.elements.find(el => el.id === id);
      if (element) {
        element.zIndex = maxZ + 1;
      }
    }));
    get().pushHistory();
  },

  sendToBack: (id) => {
    const minZ = Math.min(...get().elements.map(el => el.zIndex), 0);
    set(produce<PosterState>(state => {
      const element = state.elements.find(el => el.id === id);
      if (element) {
        element.zIndex = minZ - 1;
      }
    }));
    get().pushHistory();
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        elements: history[newIndex],
        historyIndex: newIndex,
        selectedId: null,
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        elements: history[newIndex],
        historyIndex: newIndex,
        selectedId: null,
      });
    }
  },

  clear: () => {
    set({ elements: [], selectedId: null });
    get().pushHistory();
  },

  pushHistory: () => {
    const { elements, history, historyIndex, maxHistory } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements]);
    if (newHistory.length > maxHistory + 1) {
      newHistory.shift();
    } else {
      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
      return;
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
}));
