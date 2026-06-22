import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from './EventBus';

export interface SceneElement {
  id: string;
  assetId: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

export interface Frame {
  id: string;
  index: number;
  elements: SceneElement[];
}

export interface ProjectData {
  id: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  frames: Frame[];
}

interface PixelStore {
  frames: Frame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  selectedElementId: string | null;
  playProgress: number;

  addFrame: () => void;
  removeFrame: (frameId: string) => void;
  setCurrentFrameIndex: (index: number) => void;
  addElement: (element: Omit<SceneElement, 'id'>) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<SceneElement>) => void;
  setSelectedElement: (elementId: string | null) => void;
  setPlaying: (playing: boolean) => void;
  setPlayProgress: (progress: number) => void;
  reorderFrames: (fromIndex: number, toIndex: number) => void;
  exportProject: () => ProjectData;
  importProject: (data: ProjectData) => void;
  getCurrentFrame: () => Frame | undefined;
}

const createEmptyFrame = (index: number): Frame => ({
  id: uuidv4(),
  index,
  elements: [],
});

export const usePixelStore = create<PixelStore>((set, get) => ({
  frames: [createEmptyFrame(0)],
  currentFrameIndex: 0,
  isPlaying: false,
  selectedElementId: null,
  playProgress: 0,

  addFrame: () => {
    const { frames, currentFrameIndex } = get();
    const currentFrame = frames[currentFrameIndex];
    const newFrame: Frame = {
      id: uuidv4(),
      index: frames.length,
      elements: currentFrame
        ? currentFrame.elements.map(el => ({ ...el, id: uuidv4() }))
        : [],
    };
    const newFrames = [...frames, newFrame];
    newFrames.forEach((f, i) => { f.index = i; });
    set({ frames: newFrames, currentFrameIndex: newFrames.length - 1 });
    eventBus.emit('frame:added', newFrame);
  },

  removeFrame: (frameId: string) => {
    const { frames } = get();
    if (frames.length <= 1) return;
    const newFrames = frames.filter(f => f.id !== frameId);
    newFrames.forEach((f, i) => { f.index = i; });
    const newIndex = Math.min(get().currentFrameIndex, newFrames.length - 1);
    set({ frames: newFrames, currentFrameIndex: newIndex });
    eventBus.emit('frame:removed', frameId);
  },

  setCurrentFrameIndex: (index: number) => {
    set({ currentFrameIndex: index, selectedElementId: null });
    eventBus.emit('frame:change', index);
  },

  addElement: (element) => {
    const { frames, currentFrameIndex } = get();
    const newElement: SceneElement = { ...element, id: uuidv4() };
    const newFrames = frames.map((f, i) =>
      i === currentFrameIndex
        ? { ...f, elements: [...f.elements, newElement] }
        : f
    );
    set({ frames: newFrames });
    eventBus.emit('element:added', newElement);
  },

  removeElement: (elementId: string) => {
    const { frames, currentFrameIndex, selectedElementId } = get();
    const newFrames = frames.map((f, i) =>
      i === currentFrameIndex
        ? { ...f, elements: f.elements.filter(el => el.id !== elementId) }
        : f
    );
    set({
      frames: newFrames,
      selectedElementId: selectedElementId === elementId ? null : selectedElementId,
    });
    eventBus.emit('element:removed', elementId);
  },

  updateElement: (elementId: string, updates: Partial<SceneElement>) => {
    const { frames, currentFrameIndex } = get();
    const newFrames = frames.map((f, i) =>
      i === currentFrameIndex
        ? {
            ...f,
            elements: f.elements.map(el =>
              el.id === elementId ? { ...el, ...updates } : el
            ),
          }
        : f
    );
    set({ frames: newFrames });
    eventBus.emit('element:updated', { elementId, updates });
  },

  setSelectedElement: (elementId: string | null) => {
    set({ selectedElementId: elementId });
    eventBus.emit('element:selected', elementId);
  },

  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
    if (playing) {
      eventBus.emit('play:start');
    } else {
      eventBus.emit('play:stop');
    }
  },

  setPlayProgress: (progress: number) => {
    set({ playProgress: progress });
    eventBus.emit('play:progress', progress);
  },

  reorderFrames: (fromIndex: number, toIndex: number) => {
    const { frames } = get();
    const newFrames = [...frames];
    const [moved] = newFrames.splice(fromIndex, 1);
    newFrames.splice(toIndex, 0, moved);
    newFrames.forEach((f, i) => { f.index = i; });
    set({ frames: newFrames });
    eventBus.emit('frame:reordered', { fromIndex, toIndex });
  },

  exportProject: () => {
    const { frames } = get();
    return {
      id: uuidv4(),
      name: '像素小剧场项目',
      canvasWidth: 512,
      canvasHeight: 512,
      gridSize: 16,
      frames: frames.map(f => ({
        id: f.id,
        index: f.index,
        elements: f.elements.map(el => ({ ...el })),
      })),
    };
  },

  importProject: (data: ProjectData) => {
    set({
      frames: data.frames.map(f => ({
        id: f.id || uuidv4(),
        index: f.index,
        elements: f.elements.map(el => ({
          ...el,
          id: el.id || uuidv4(),
        })),
      })),
      currentFrameIndex: 0,
      selectedElementId: null,
      isPlaying: false,
      playProgress: 0,
    });
  },

  getCurrentFrame: () => {
    const { frames, currentFrameIndex } = get();
    return frames[currentFrameIndex];
  },
}));
