import { create } from 'zustand';
import type { VisualizerState, VisualizerActions, ThemeType, SpectrumData } from '@/types';

const useVisualizerStore = create<VisualizerState & VisualizerActions>((set) => ({
  audioFile: null,
  spectrumData: null,
  currentFrame: 0,
  isPlaying: false,
  particleCount: 2000,
  particleSize: 1.0,
  particleColorStart: '#00ffff',
  particleColorEnd: '#ff00ff',
  rotationSpeed: 1.0,
  clusteringAmount: 0.5,
  theme: 'aurora',
  loopStart: null,
  loopEnd: null,
  isUploading: false,
  uploadProgress: 0,

  setAudioFile: (file: File | null) => set({ audioFile: file }),
  setSpectrumData: (data: SpectrumData | null) => set({ spectrumData: data }),
  setCurrentFrame: (frame: number) => set({ currentFrame: frame }),
  setPlaying: (playing: boolean) => set({ isPlaying: playing }),
  setParticleCount: (count: number) => set({ particleCount: count }),
  setParticleSize: (size: number) => set({ particleSize: size }),
  setParticleColorStart: (color: string) => set({ particleColorStart: color }),
  setParticleColorEnd: (color: string) => set({ particleColorEnd: color }),
  setRotationSpeed: (speed: number) => set({ rotationSpeed: speed }),
  setClusteringAmount: (amount: number) => set({ clusteringAmount: amount }),
  setTheme: (theme: ThemeType) => set({ theme }),
  setLoopStart: (frame: number | null) => set({ loopStart: frame }),
  setLoopEnd: (frame: number | null) => set({ loopEnd: frame }),
  setUploading: (uploading: boolean) => set({ isUploading: uploading }),
  setUploadProgress: (progress: number) => set({ uploadProgress: progress }),
}));

export default useVisualizerStore;
