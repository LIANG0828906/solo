import { create } from 'zustand'

const FFT_SIZE = 256

interface AudioState {
  frequencyData: Uint8Array
  timeDomainData: Uint8Array
  beat: number
  volume: number
  isPlaying: boolean
  fileName: string
  duration: number
  update: (
    freq: Uint8Array,
    time: Uint8Array,
    beat: number,
    volume: number
  ) => void
  setPlaying: (playing: boolean) => void
  setFileInfo: (name: string, duration: number) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  frequencyData: new Uint8Array(FFT_SIZE / 2),
  timeDomainData: new Uint8Array(FFT_SIZE / 2),
  beat: 0,
  volume: 0,
  isPlaying: false,
  fileName: '',
  duration: 0,
  update: (freq, time, beat, volume) =>
    set(() => ({
      frequencyData: freq,
      timeDomainData: time,
      beat,
      volume,
    })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setFileInfo: (name, duration) => set({ fileName: name, duration }),
}))
