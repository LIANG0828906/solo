import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { audioEngine, type NoiseType } from '../audio/engine'

export interface Preset {
  id: string
  name: string
  description: string
  leftFrequency: number
  rightFrequency: number
  noiseType: NoiseType
  reverbDepth: number
  volume: number
  isCustom?: boolean
}

interface AudioState {
  presets: Preset[]
  currentPresetId: string | null
  isPlaying: boolean
  leftFrequency: number
  rightFrequency: number
  noiseType: NoiseType
  reverbDepth: number
  volume: number
  currentTime: number
  duration: number
  isCreateModalOpen: boolean

  setPreset: (id: string) => void
  togglePlay: () => void
  updateFrequency: (channel: 'left' | 'right', value: number) => void
  setNoiseType: (type: NoiseType) => void
  setReverbDepth: (value: number) => void
  setVolume: (value: number) => void
  addPreset: (preset: Omit<Preset, 'id' | 'isCustom'>) => void
  reorderPresets: (fromIndex: number, toIndex: number) => void
  setCurrentTime: (time: number) => void
  openCreateModal: () => void
  closeCreateModal: () => void
  getCurrentPreset: () => Preset | null
}

const defaultPresets: Preset[] = [
  {
    id: 'deep-work',
    name: '深度工作',
    description: '40Hz binaural beats 辅助深度专注',
    leftFrequency: 200,
    rightFrequency: 240,
    noiseType: 'rain',
    reverbDepth: 20,
    volume: 0.5,
  },
  {
    id: 'meditation',
    name: '冥想',
    description: '低频双耳节拍引导深度放松',
    leftFrequency: 100,
    rightFrequency: 108,
    noiseType: 'ocean',
    reverbDepth: 50,
    volume: 0.4,
  },
  {
    id: 'nap',
    name: '小睡',
    description: '舒缓的白噪音帮助快速入眠',
    leftFrequency: 80,
    rightFrequency: 84,
    noiseType: 'fan',
    reverbDepth: 30,
    volume: 0.3,
  },
  {
    id: 'focus-light',
    name: '轻度专注',
    description: '温和的背景音维持注意力',
    leftFrequency: 300,
    rightFrequency: 305,
    noiseType: 'rain',
    reverbDepth: 15,
    volume: 0.35,
  },
]

export const useAudioStore = create<AudioState>((set, get) => ({
  presets: defaultPresets,
  currentPresetId: 'deep-work',
  isPlaying: false,
  leftFrequency: 200,
  rightFrequency: 240,
  noiseType: 'rain',
  reverbDepth: 20,
  volume: 0.5,
  currentTime: 0,
  duration: 3600,
  isCreateModalOpen: false,

  setPreset: (id: string) => {
    const preset = get().presets.find((p) => p.id === id)
    if (!preset) return

    set({
      currentPresetId: id,
      leftFrequency: preset.leftFrequency,
      rightFrequency: preset.rightFrequency,
      noiseType: preset.noiseType,
      reverbDepth: preset.reverbDepth,
      volume: preset.volume,
    })

    audioEngine.setFrequency('left', preset.leftFrequency)
    audioEngine.setFrequency('right', preset.rightFrequency)
    audioEngine.setNoiseType(preset.noiseType)
    audioEngine.setReverbDepth(preset.reverbDepth)
    audioEngine.setVolume(preset.volume)
  },

  togglePlay: async () => {
    const { isPlaying } = get()

    if (isPlaying) {
      audioEngine.stop()
      set({ isPlaying: false })
    } else {
      await audioEngine.start()
      set({ isPlaying: true })
    }
  },

  updateFrequency: (channel: 'left' | 'right', value: number) => {
    set(channel === 'left' ? { leftFrequency: value } : { rightFrequency: value })
    audioEngine.setFrequency(channel, value)
  },

  setNoiseType: (type: NoiseType) => {
    set({ noiseType: type })
    audioEngine.setNoiseType(type)
  },

  setReverbDepth: (value: number) => {
    set({ reverbDepth: value })
    audioEngine.setReverbDepth(value)
  },

  setVolume: (value: number) => {
    set({ volume: value })
    audioEngine.setVolume(value)
  },

  addPreset: (preset) => {
    const newPreset: Preset = {
      ...preset,
      id: uuidv4(),
      isCustom: true,
    }
    set((state) => ({
      presets: [...state.presets, newPreset],
    }))
  },

  reorderPresets: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newPresets = [...state.presets]
      const [removed] = newPresets.splice(fromIndex, 1)
      newPresets.splice(toIndex, 0, removed)
      return { presets: newPresets }
    })
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time })
  },

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  getCurrentPreset: () => {
    const { presets, currentPresetId } = get()
    return presets.find((p) => p.id === currentPresetId) || null
  },
}))
