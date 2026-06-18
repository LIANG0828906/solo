import { create } from 'zustand'

interface AudioState {
  audioFile: File | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  frequencyData: Uint8Array
  waveformData: Uint8Array
  setAudioFile: (file: File | null) => void
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setFrequencyData: (data: Uint8Array) => void
  setWaveformData: (data: Uint8Array) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  audioFile: null,
  isPlaying: false,
  volume: 70,
  currentTime: 0,
  duration: 0,
  frequencyData: new Uint8Array(64),
  waveformData: new Uint8Array(256),
  setAudioFile: (file) => set({ audioFile: file }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setFrequencyData: (data) => set({ frequencyData: data }),
  setWaveformData: (data) => set({ waveformData: data }),
}))
