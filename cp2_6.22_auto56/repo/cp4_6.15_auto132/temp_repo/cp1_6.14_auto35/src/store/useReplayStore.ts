import { create } from 'zustand';
import { BattleLog, BattleFrame } from '@/types/replay';

interface ReplayState {
  battleLog: BattleLog | null;
  currentFrameIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  currentFrame: BattleFrame | null;
  totalFrames: number;

  setBattleLog: (log: BattleLog) => void;
  setCurrentFrameIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  reset: () => void;
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  battleLog: null,
  currentFrameIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  currentFrame: null,
  totalFrames: 0,

  setBattleLog: (log: BattleLog) => {
    const firstFrame = log.frames[0] ?? null;
    set({
      battleLog: log,
      currentFrameIndex: 0,
      currentFrame: firstFrame,
      totalFrames: log.frames.length,
      isPlaying: false,
    });
  },

  setCurrentFrameIndex: (index: number) => {
    const { battleLog, totalFrames } = get();
    if (!battleLog) return;
    const clamped = Math.max(0, Math.min(index, totalFrames - 1));
    set({
      currentFrameIndex: clamped,
      currentFrame: battleLog.frames[clamped] ?? null,
    });
  },

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

  stepForward: () => {
    const { currentFrameIndex, totalFrames, isPlaying } = get();
    if (isPlaying) set({ isPlaying: false });
    if (currentFrameIndex < totalFrames - 1) {
      get().setCurrentFrameIndex(currentFrameIndex + 1);
    }
  },

  stepBackward: () => {
    const { currentFrameIndex, isPlaying } = get();
    if (isPlaying) set({ isPlaying: false });
    if (currentFrameIndex > 0) {
      get().setCurrentFrameIndex(currentFrameIndex - 1);
    }
  },

  reset: () =>
    set({
      battleLog: null,
      currentFrameIndex: 0,
      isPlaying: false,
      playbackSpeed: 1,
      currentFrame: null,
      totalFrames: 0,
    }),
}));
