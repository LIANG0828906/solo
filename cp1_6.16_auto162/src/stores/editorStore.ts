import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ToolMode = 'pencil' | 'fill' | 'picker' | 'move';

export type Frame = {
  id: string;
  pixels: (string | null)[][];
  duration: number;
};

export type OnlineUser = {
  id: string;
  name: string;
  color: string;
};

type EditorState = {
  brushColor: string;
  toolMode: ToolMode;
  pixels: (string | null)[][];
  expressionId: string | null;
  expressionOffset: { x: number; y: number };
  room: string;
  userName: string;
  onlineUsers: OnlineUser[];
  frames: Frame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  playFrameIndex: number;
  zoom: number;
  canvasOffset: { x: number; y: number };

  setBrushColor: (color: string) => void;
  setToolMode: (mode: ToolMode) => void;
  setPixels: (pixels: (string | null)[][]) => void;
  setPixel: (x: number, y: number, color: string | null) => void;
  setBulkPixels: (data: { x: number; y: number; color: string | null }[]) => void;
  setExpressionId: (id: string | null) => void;
  setExpressionOffset: (offset: { x: number; y: number }) => void;
  setRoom: (room: string) => void;
  setUserName: (name: string) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  addFrame: (duration?: number) => void;
  deleteFrame: (index: number) => void;
  reorderFrames: (from: number, to: number) => void;
  setCurrentFrameIndex: (index: number) => void;
  updateFrameDuration: (index: number, duration: number) => void;
  setFrames: (frames: Frame[], currentIndex: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlayFrameIndex: (index: number | ((prev: number) => number)) => void;
  setZoom: (zoom: number) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  applyFrameToCanvas: (index: number) => void;
  clearCanvas: () => void;
};

function createEmptyPixels(): (string | null)[][] {
  return Array.from({ length: 32 }, () => Array(32).fill(null));
}

function clonePixels(pixels: (string | null)[][]): (string | null)[][] {
  return pixels.map((row) => [...row]);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  brushColor: '#FF004D',
  toolMode: 'pencil',
  pixels: createEmptyPixels(),
  expressionId: null,
  expressionOffset: { x: 0, y: 0 },
  room: '',
  userName: '',
  onlineUsers: [],
  frames: [],
  currentFrameIndex: -1,
  isPlaying: false,
  playFrameIndex: 0,
  zoom: 1,
  canvasOffset: { x: 0, y: 0 },

  setBrushColor: (color) => set({ brushColor: color }),
  setToolMode: (mode) => set({ toolMode: mode }),
  setPixels: (pixels) => set({ pixels: clonePixels(pixels) }),
  setPixel: (x, y, color) => {
    const { pixels } = get();
    if (x < 0 || x >= 32 || y < 0 || y >= 32) return;
    const newPixels = clonePixels(pixels);
    newPixels[y][x] = color;
    set({ pixels: newPixels });
  },
  setBulkPixels: (data) => {
    const { pixels } = get();
    const newPixels = clonePixels(pixels);
    data.forEach(({ x, y, color }) => {
      if (x >= 0 && x < 32 && y >= 0 && y < 32) {
        newPixels[y][x] = color;
      }
    });
    set({ pixels: newPixels });
  },
  setExpressionId: (id) => set({ expressionId: id }),
  setExpressionOffset: (offset) => set({ expressionOffset: offset }),
  setRoom: (room) => set({ room }),
  setUserName: (name) => set({ userName: name }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addFrame: (duration = 0.2) => {
    const { frames, pixels } = get();
    if (frames.length >= 12) return;
    const newFrame: Frame = {
      id: uuidv4(),
      pixels: clonePixels(pixels),
      duration,
    };
    const newFrames = [...frames, newFrame];
    set({ frames: newFrames, currentFrameIndex: newFrames.length - 1 });
  },
  deleteFrame: (index) => {
    const { frames, currentFrameIndex } = get();
    const newFrames = frames.filter((_, i) => i !== index);
    let newIndex = currentFrameIndex;
    if (newIndex >= newFrames.length) newIndex = newFrames.length - 1;
    set({ frames: newFrames, currentFrameIndex: newIndex });
  },
  reorderFrames: (from, to) => {
    const { frames } = get();
    const newFrames = [...frames];
    const [moved] = newFrames.splice(from, 1);
    newFrames.splice(to, 0, moved);
    set({ frames: newFrames });
  },
  setCurrentFrameIndex: (index) => set({ currentFrameIndex: index }),
  updateFrameDuration: (index, duration) => {
    const { frames } = get();
    const newFrames = [...frames];
    if (index >= 0 && index < newFrames.length) {
      newFrames[index] = { ...newFrames[index], duration };
      set({ frames: newFrames });
    }
  },
  setFrames: (frames, currentIndex) => {
    set({
      frames: frames.map((f) => ({ ...f, pixels: clonePixels(f.pixels) })),
      currentFrameIndex: currentIndex,
    });
  },
  setIsPlaying: (playing) => set({ isPlaying: playing, playFrameIndex: 0 }),
  setPlayFrameIndex: (index) =>
    set((state) => ({
      playFrameIndex: typeof index === 'function' ? index(state.playFrameIndex) : index,
    })),
  setZoom: (zoom) => set({ zoom: Math.max(1, Math.min(4, zoom)) }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  applyFrameToCanvas: (index) => {
    const { frames } = get();
    if (index >= 0 && index < frames.length) {
      set({ pixels: clonePixels(frames[index].pixels), currentFrameIndex: index });
    }
  },
  clearCanvas: () => set({ pixels: createEmptyPixels() }),
}));
