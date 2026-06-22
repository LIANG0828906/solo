import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { EditorState, EditorStore, Clip } from '@/types';
import { useVideoStore } from '../video/videoStore';

const initialState: EditorState = {
  clips: [],
  selectedClipId: null,
  timelineScale: 1,
  isPlaying: false,
  isLooping: false,
  playheadTime: 0,
  currentClipIndex: 0,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,

  addClip: (time: number) => {
    const videoMetadata = useVideoStore.getState().metadata;
    if (!videoMetadata) return;

    const startTime = Math.max(0, time - 0.5);
    const endTime = Math.min(videoMetadata.duration, time + 0.5);

    if (startTime >= endTime) return;

    const newClip: Clip = {
      id: uuidv4(),
      startTime,
      endTime,
      text: '',
      orderIndex: get().clips.length,
    };

    set((state) => ({
      clips: [...state.clips, newClip],
      selectedClipId: newClip.id,
    }));
  },

  removeClip: (clipId: string) => {
    set((state) => {
      const clipIndex = state.clips.findIndex((c) => c.id === clipId);
      if (clipIndex === -1) return state;

      const newClips = state.clips
        .filter((c) => c.id !== clipId)
        .map((c, idx) => ({
          ...c,
          orderIndex: idx,
        }));

      const isPlaying = state.isPlaying;
      let currentClipIndex = state.currentClipIndex;

      if (isPlaying && newClips.length > 0) {
        currentClipIndex = Math.min(clipIndex, newClips.length - 1);
      }

      return {
        clips: newClips,
        selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
        currentClipIndex,
      };
    });
  },

  reorderClip: (clipId: string, newIndex: number) => {
    set((state) => {
      const clips = [...state.clips];
      const currentIndex = clips.findIndex((c) => c.id === clipId);
      if (currentIndex === -1) return state;

      const [movedClip] = clips.splice(currentIndex, 1);
      const clampedIndex = Math.max(0, Math.min(newIndex, clips.length));
      clips.splice(clampedIndex, 0, movedClip);

      const reorderedClips = clips.map((c, idx) => ({
        ...c,
        orderIndex: idx,
      }));

      return {
        clips: reorderedClips,
      };
    });
  },

  updateClipTime: (clipId: string, startTime: number, endTime: number) => {
    const videoMetadata = useVideoStore.getState().metadata;
    if (!videoMetadata) return;

    const clampedStart = Math.max(0, Math.min(startTime, endTime - 0.1));
    const clampedEnd = Math.max(clampedStart + 0.1, Math.min(endTime, videoMetadata.duration));

    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId ? { ...c, startTime: clampedStart, endTime: clampedEnd } : c
      ),
    }));
  },

  updateClipText: (clipId: string, text: string) => {
    set((state) => ({
      clips: state.clips.map((c) => (c.id === clipId ? { ...c, text } : c)),
    }));
  },

  selectClip: (clipId: string | null) => {
    set({ selectedClipId: clipId });
  },

  setTimelineScale: (scale: number) => {
    const clampedScale = Math.max(0.5, Math.min(4, scale));
    set({ timelineScale: clampedScale });
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  stop: () => {
    const sortedClips = [...get().clips].sort((a, b) => a.orderIndex - b.orderIndex);
    const startTime = sortedClips.length > 0 ? sortedClips[0].startTime : 0;

    set({
      isPlaying: false,
      playheadTime: startTime,
      currentClipIndex: 0,
    });

    useVideoStore.getState().seekToTime(startTime);
  },

  toggleLoop: () => {
    set((state) => ({ isLooping: !state.isLooping }));
  },

  setPlayheadTime: (time: number) => {
    set({ playheadTime: time });
  },
}));
