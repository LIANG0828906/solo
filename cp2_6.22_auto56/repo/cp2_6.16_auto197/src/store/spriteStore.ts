import { create } from 'zustand';
import type { SpriteStore, SpriteFrame } from '@/types';
import {
  cutFramesFromSpriteSheet,
  duplicateFrame as utilsDuplicateFrame,
  createBlankFrame,
  getMaxFrameSize,
} from '@/utils/frameUtils';
import { createCanvas, downloadDataURL } from '@/utils/canvasUtils';

export const useSpriteStore = create<SpriteStore>((set, get) => ({
  spriteSheet: {
    image: null,
    width: 0,
    height: 0,
    selection: null,
  },
  frames: [],
  selectedFrameIds: [],
  timeline: {
    frameIds: [],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: 10,
    loop: true,
    loopCount: 0,
  },
  exportState: {
    isExporting: false,
    progress: 0,
  },

  setSpriteSheet: (image: HTMLImageElement) =>
    set({
      spriteSheet: {
        image,
        width: image.width,
        height: image.height,
        selection: null,
      },
    }),

  setSelection: (selection) =>
    set((state) => ({
      spriteSheet: {
        ...state.spriteSheet,
        selection,
      },
    })),

  cutFrames: () => {
    const { spriteSheet } = get();
    if (!spriteSheet.image || !spriteSheet.selection) return;

    const newFrames = cutFramesFromSpriteSheet(
      spriteSheet.image,
      spriteSheet.selection
    );

    set((state) => ({
      frames: [...state.frames, ...newFrames],
      selectedFrameIds: [],
    }));
  },

  renameFrame: (id: string, name: string) =>
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === id ? { ...f, name } : f
      ),
    })),

  deleteFrames: (ids: string[]) =>
    set((state) => {
      const idSet = new Set(ids);
      const newFrames = state.frames.filter((f) => !idSet.has(f.id));
      const newTimelineFrameIds = state.timeline.frameIds.filter(
        (id) => !idSet.has(id)
      );
      return {
        frames: newFrames,
        selectedFrameIds: state.selectedFrameIds.filter(
          (id) => !idSet.has(id)
        ),
        timeline: {
          ...state.timeline,
          frameIds: newTimelineFrameIds,
          currentFrameIndex: Math.min(
            state.timeline.currentFrameIndex,
            Math.max(0, newTimelineFrameIds.length - 1)
          ),
        },
      };
    }),

  setFrameDuration: (id: string, duration: number) =>
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === id ? { ...f, duration } : f
      ),
    })),

  setBulkDuration: (ids: string[], duration: number) => {
    const idSet = new Set(ids);
    set((state) => ({
      frames: state.frames.map((f) =>
        idSet.has(f.id) ? { ...f, duration } : f
      ),
    }));
  },

  selectFrame: (id: string, multi = false) =>
    set((state) => {
      if (multi) {
        const isSelected = state.selectedFrameIds.includes(id);
        return {
          selectedFrameIds: isSelected
            ? state.selectedFrameIds.filter((fid) => fid !== id)
            : [...state.selectedFrameIds, id],
        };
      }
      return { selectedFrameIds: [id] };
    }),

  clearSelection: () => set({ selectedFrameIds: [] }),

  addToTimeline: (frameId: string, index?) =>
    set((state) => {
      const newFrameIds = [...state.timeline.frameIds];
      if (index === undefined) {
        newFrameIds.push(frameId);
      } else {
        newFrameIds.splice(index, 0, frameId);
      }
      return {
        timeline: {
          ...state.timeline,
          frameIds: newFrameIds,
        },
      };
    }),

  removeFromTimeline: (index: number) =>
    set((state) => {
      const newFrameIds = [...state.timeline.frameIds];
      newFrameIds.splice(index, 1);
      return {
        timeline: {
          ...state.timeline,
          frameIds: newFrameIds,
          currentFrameIndex: Math.min(
            state.timeline.currentFrameIndex,
            Math.max(0, newFrameIds.length - 1)
          ),
        },
      };
    }),

  reorderTimeline: (fromIndex: number, toIndex: number) =>
    set((state) => {
      const newFrameIds = [...state.timeline.frameIds];
      const [removed] = newFrameIds.splice(fromIndex, 1);
      newFrameIds.splice(toIndex, 0, removed);
      return {
        timeline: {
          ...state.timeline,
          frameIds: newFrameIds,
        },
      };
    }),

  duplicateFrame: (index: number) =>
    set((state) => {
      const frameId = state.timeline.frameIds[index];
      const frame = state.frames.find((f) => f.id === frameId);
      if (!frame) return state;

      const newFrame = utilsDuplicateFrame(frame);
      const newFrameIds = [...state.timeline.frameIds];
      newFrameIds.splice(index + 1, 0, newFrame.id);

      return {
        frames: [...state.frames, newFrame],
        timeline: {
          ...state.timeline,
          frameIds: newFrameIds,
        },
      };
    }),

  insertBlankFrame: (index: number) =>
    set((state) => {
      const blank = createBlankFrame(32, 32);
      const newFrameIds = [...state.timeline.frameIds];
      newFrameIds.splice(index, 0, blank.id);

      return {
        frames: [...state.frames, blank],
        timeline: {
          ...state.timeline,
          frameIds: newFrameIds,
        },
      };
    }),

  setPlaying: (playing: boolean) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        isPlaying: playing,
        loopCount: playing ? 0 : state.timeline.loopCount,
      },
    })),

  setFps: (fps: number) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        fps: Math.max(1, Math.min(60, fps)),
      },
    })),

  setLoop: (loop: boolean) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        loop,
      },
    })),

  setCurrentFrameIndex: (index: number) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        currentFrameIndex: index,
      },
    })),

  exportSpriteSheet: async () => {
    const { timeline, frames } = get();
    const timelineFrames: SpriteFrame[] = [];

    for (const id of timeline.frameIds) {
      const frame = frames.find((f) => f.id === id);
      if (frame) timelineFrames.push(frame);
    }

    if (timelineFrames.length === 0) return;

    set({ exportState: { isExporting: true, progress: 0 } });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const { width: maxWidth, height: maxHeight } = getMaxFrameSize(timelineFrames);
    const totalHeight = maxHeight * timelineFrames.length;
    const canvas = createCanvas(maxWidth, totalHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < timelineFrames.length; i++) {
      const frame = timelineFrames[i];
      const x = Math.floor((maxWidth - frame.width) / 2);
      const y = i * maxHeight;
      ctx.putImageData(frame.imageData, x, y);

      set({
        exportState: {
          isExporting: true,
          progress: (i + 1) / timelineFrames.length,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const dataURL = canvas.toDataURL('image/png');
    downloadDataURL(dataURL, 'spriteforge_export.png');

    set({ exportState: { isExporting: false, progress: 0 } });
  },
}));
