import { create } from 'zustand'

type AudioSource = 'file' | 'mic' | null

interface AudioState {
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  sourceNode: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null
  frequencyData: Uint8Array
  lowFrequency: number
  midFrequency: number
  highFrequency: number
  sensitivity: number
  audioSource: AudioSource
  isPlaying: boolean
  initAudio: () => void
  startFileAudio: (file: File) => Promise<void>
  startMicAudio: () => Promise<void>
  stopAudio: () => void
  getFrequencyData: () => void
  setSensitivity: (value: number) => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  audioContext: null,
  analyser: null,
  sourceNode: null,
  frequencyData: new Uint8Array(256),
  lowFrequency: 0,
  midFrequency: 0,
  highFrequency: 0,
  sensitivity: 1.0,
  audioSource: null,
  isPlaying: false,

  initAudio: () => {
    if (get().audioContext) return
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.8
    set({ audioContext, analyser, frequencyData: new Uint8Array(analyser.frequencyBinCount) })
  },

  startFileAudio: async (file: File) => {
    const { audioContext, analyser, stopAudio } = get()
    if (!audioContext || !analyser) return

    stopAudio()

    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    source.start(0)
    source.onended = () => {
      set({ isPlaying: false, audioSource: null })
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    set({ sourceNode: source as any, audioSource: 'file', isPlaying: true })
  },

  startMicAudio: async () => {
    const { audioContext, analyser, stopAudio } = get()
    if (!audioContext || !analyser) return

    stopAudio()

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    set({ sourceNode: source, audioSource: 'mic', isPlaying: true })
  },

  stopAudio: () => {
    const { sourceNode, audioContext } = get()
    if (sourceNode) {
      if ('stop' in sourceNode) {
        try { (sourceNode as MediaElementAudioSourceNode & { stop: () => void }).stop() } catch {}
      }
      if ('mediaStream' in sourceNode) {
        (sourceNode as MediaStreamAudioSourceNode).mediaStream.getTracks().forEach(track => track.stop())
      }
      sourceNode.disconnect()
    }
    if (audioContext) {
      audioContext.suspend()
    }
    set({
      sourceNode: null,
      audioSource: null,
      isPlaying: false,
      lowFrequency: 0,
      midFrequency: 0,
      highFrequency: 0
    })
  },

  getFrequencyData: () => {
    const { analyser, frequencyData, sensitivity } = get()
    if (!analyser) return

    analyser.getByteFrequencyData(frequencyData as Uint8Array)

    const binCount = analyser.frequencyBinCount
    const sampleRate = analyser.context.sampleRate
    const nyquist = sampleRate / 2

    const lowEnd = Math.floor((250 / nyquist) * binCount)
    const midEnd = Math.floor((2000 / nyquist) * binCount)

    let lowSum = 0
    let midSum = 0
    let highSum = 0

    for (let i = 0; i < lowEnd; i++) {
      lowSum += frequencyData[i]
    }
    for (let i = lowEnd; i < midEnd; i++) {
      midSum += frequencyData[i]
    }
    for (let i = midEnd; i < binCount; i++) {
      highSum += frequencyData[i]
    }

    const lowAvg = (lowSum / Math.max(lowEnd, 1)) / 255 * sensitivity
    const midAvg = (midSum / Math.max(midEnd - lowEnd, 1)) / 255 * sensitivity
    const highAvg = (highSum / Math.max(binCount - midEnd, 1)) / 255 * sensitivity

    set({
      lowFrequency: Math.min(1, lowAvg),
      midFrequency: Math.min(1, midAvg),
      highFrequency: Math.min(1, highAvg)
    })
  },

  setSensitivity: (value: number) => set({ sensitivity: value })
}))
