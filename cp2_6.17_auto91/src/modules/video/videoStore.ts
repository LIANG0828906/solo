import { create } from 'zustand';
import type { VideoState, VideoStore } from '@/types';
import { videoEngine } from './videoEngine';
import { generateSampleVideo } from './sampleVideo';

const initialState: VideoState = {
  sourceUrl: null,
  metadata: null,
  isLoading: false,
  loadError: null,
  currentFrame: null,
  currentTime: 0,
  currentFrameIndex: 0,
};

export const useVideoStore = create<VideoStore>((set, get) => ({
  ...initialState,

  loadVideo: async (url: string) => {
    set({ isLoading: true, loadError: null });
    try {
      const metadata = await videoEngine.loadVideo(url);
      const firstFrame = await videoEngine.seekToTime(0);
      set({
        sourceUrl: url,
        metadata,
        isLoading: false,
        currentFrame: firstFrame,
        currentTime: 0,
        currentFrameIndex: 0,
      });
    } catch (error) {
      set({
        isLoading: false,
        loadError: error instanceof Error ? error.message : 'Failed to load video',
      });
    }
  },

  seekToFrame: async (frameIndex: number) => {
    const { metadata } = get();
    if (!metadata) return;

    const time = frameIndex / metadata.fps;
    await get().seekToTime(time);
  },

  seekToTime: async (time: number) => {
    const { metadata } = get();
    if (!metadata) return;

    const clampedTime = Math.max(0, Math.min(time, metadata.duration));
    const frame = await videoEngine.seekToTime(clampedTime);
    set({
      currentFrame: frame,
      currentTime: clampedTime,
      currentFrameIndex: Math.floor(clampedTime * metadata.fps),
    });
  },

  getFrameAtTime: async (time: number) => {
    return videoEngine.getFrameAtTime(time);
  },
}));

export async function loadSampleVideo(): Promise<void> {
  try {
    const url = await generateSampleVideo(10);
    await useVideoStore.getState().loadVideo(url);
  } catch (error) {
    console.error('Failed to load sample video:', error);
    useVideoStore.setState({
      isLoading: false,
      loadError: error instanceof Error ? error.message : 'Failed to load sample video',
    });
  }
}
