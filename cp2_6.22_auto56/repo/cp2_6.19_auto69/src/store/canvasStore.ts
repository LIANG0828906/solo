import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Point } from '../utils/geometry';

export interface LineElement {
  id: string;
  type: 'line';
  points: Point[];
  smoothedPoints: Point[];
  color: string;
  strokeWidth: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  createdAt: number;
}

export interface StickyNoteElement {
  id: string;
  type: 'stickyNote';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  createdAt: number;
  isNew?: boolean;
}

export interface ArrowElement {
  id: string;
  type: 'arrow';
  fromId: string;
  toId: string;
  label: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isLeaving?: boolean;
}

export type CanvasElement = LineElement | StickyNoteElement | ArrowElement;
export type ToolType = 'pen' | 'eraser' | 'text' | 'delete' | 'select';

interface AnimationState {
  elementId: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number;
  duration: number;
}

interface CanvasState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  currentTool: ToolType;
  currentColor: string;
  users: User[];
  currentUserId: string;
  currentUserName: string;
  animations: Map<string, AnimationState>;
  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setSelectedElement: (id: string | null) => void;
  addElement: (element: Omit<LineElement, 'id' | 'createdAt'> | Omit<StickyNoteElement, 'id' | 'createdAt'>, broadcast?: boolean) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>, broadcast?: boolean) => void;
  removeElement: (id: string, broadcast?: boolean) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  setCurrentUser: (id: string, name: string) => void;
  startAnimation: (elementId: string, targetX: number, targetY: number) => void;
  updateAnimations: (currentTime: number) => void;
  clearAll: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#64748b', '#84cc16', '#14b8a6', '#a855f7',
];

const USER_COLORS = [
  '#ef4444', '#f59e0b', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
];

const generateRandomName = (): string => {
  const adjectives = ['快乐的', '聪明的', '勇敢的', '可爱的', '神秘的', '阳光的'];
  const nouns = ['小猫', '小狗', '小兔', '小熊', '小鹿', '小鸟'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
};

const initUserId = uuidv4();
const initUserName = generateRandomName();
const initUserColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedElementId: null,
  currentTool: 'pen',
  currentColor: PRESET_COLORS[0],
  users: [{
    id: initUserId,
    name: initUserName,
    color: initUserColor,
    avatar: initUserName.charAt(0),
  }],
  currentUserId: initUserId,
  currentUserName: initUserName,
  animations: new Map(),

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ currentColor: color }),
  setSelectedElement: (id) => set({ selectedElementId: id }),

  addElement: (element, broadcast = true) => {
    const newId = uuidv4();
    const newElement: CanvasElement = {
      ...element,
      id: newId,
      createdAt: Date.now(),
    } as CanvasElement;
    set((state) => ({
      elements: [...state.elements, newElement],
    }));
    if (broadcast) {
      const { broadcastService } = get() as unknown as { broadcastService?: { send: (msg: unknown) => void } };
      if (broadcastService) {
        broadcastService.send({
          type: 'elementAdded',
          payload: newElement,
          senderId: initUserId,
          timestamp: Date.now(),
        });
      }
    }
    return newId;
  },

  updateElement: (id, updates, broadcast = true) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } as CanvasElement : el
      ),
    }));
    if (broadcast) {
      const { broadcastService } = get() as unknown as { broadcastService?: { send: (msg: unknown) => void } };
      if (broadcastService) {
        broadcastService.send({
          type: 'elementUpdated',
          payload: { id, updates },
          senderId: initUserId,
          timestamp: Date.now(),
        });
      }
    }
  },

  removeElement: (id, broadcast = true) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    if (broadcast) {
      const { broadcastService } = get() as unknown as { broadcastService?: { send: (msg: unknown) => void } };
      if (broadcastService) {
        broadcastService.send({
          type: 'elementRemoved',
          payload: { id },
          senderId: initUserId,
          timestamp: Date.now(),
        });
      }
    }
  },

  addUser: (user) => {
    set((state) => ({
      users: [...state.users.filter((u) => u.id !== user.id), user],
    }));
  },

  removeUser: (userId) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, isLeaving: true } : u
      ),
    }));
    setTimeout(() => {
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
      }));
    }, 500);
  },

  setCurrentUser: (id, name) => set({ currentUserId: id, currentUserName: name }),

  startAnimation: (elementId, targetX, targetY) => {
    const element = get().elements.find((el) => el.id === elementId);
    if (!element || element.type === 'arrow') return;

    const animation: AnimationState = {
      elementId,
      startX: element.x,
      startY: element.y,
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 300,
    };

    set((state) => {
      const newAnimations = new Map(state.animations);
      newAnimations.set(elementId, animation);
      return { animations: newAnimations };
    });
  },

  updateAnimations: (currentTime) => {
    const state = get();
    const completedAnimations: string[] = [];

    state.animations.forEach((anim, elementId) => {
      const elapsed = currentTime - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentX = anim.startX + (anim.targetX - anim.startX) * easedProgress;
      const currentY = anim.startY + (anim.targetY - anim.startY) * easedProgress;

      set((s) => ({
        elements: s.elements.map((el) =>
          el.id === elementId ? { ...el, x: currentX, y: currentY } : el
        ),
      }));

      if (progress >= 1) {
        completedAnimations.push(elementId);
      }
    });

    if (completedAnimations.length > 0) {
      set((s) => {
        const newAnimations = new Map(s.animations);
        completedAnimations.forEach((id) => newAnimations.delete(id));
        return { animations: newAnimations };
      });
    }
  },

  clearAll: () => set({ elements: [], selectedElementId: null }),
}));

export { PRESET_COLORS, USER_COLORS };
