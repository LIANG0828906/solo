import { useAudioStore } from '@/store/audioStore'

const FFT_SIZE = 256

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let gainNode: GainNode | null = null
let audioBuffer: AudioBuffer | null = null
let sourceNode: AudioBufferSourceNode | null = null
let animationFrameId: number | null = null
let frequencyDataArr: Uint8Array | null = null
let timeDomainArr: Uint8Array | null = null
let beatHistory: number[] = []

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = FFT_SIZE
    analyser.smoothingTimeConstant = 0.8

    gainNode = audioContext.createGain()
    gainNode.gain.value = 0.7

    frequencyDataArr = new Uint8Array(analyser.frequencyBinCount)
    timeDomainArr = new Uint8Array(analyser.frequencyBinCount)
  }
  return audioContext
}

function computeBeat(freq: Uint8Array): number {
  const len = freq.length
  const lowEnd = Math.floor(len * 0.15)
  let sum = 0
  for (let i = 0; i < lowEnd; i++) sum += freq[i]
  const lowAvg = sum / lowEnd / 255

  beatHistory.push(lowAvg)
  if (beatHistory.length > 40) beatHistory.shift()

  const histAvg =
    beatHistory.reduce((a, b) => a + b, 0) / Math.max(beatHistory.length, 1)
  const variance =
    beatHistory.reduce((a, b) => a + (b - histAvg) ** 2, 0) /
    Math.max(beatHistory.length, 1)
  const threshold = histAvg + Math.sqrt(variance) * 1.3 + 0.08

  if (lowAvg > threshold && lowAvg > 0.15) {
    const intensity = Math.min(1, (lowAvg - threshold) / 0.3 + 0.4)
    return intensity
  }
  return 0
}

function computeVolume(time: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < time.length; i++) {
    const v = (time[i] - 128) / 128
    sum += v * v
  }
  const rms = Math.sqrt(sum / time.length)
  return Math.min(1, rms * 2.5)
}

function loop() {
  if (!analyser || !frequencyDataArr || !timeDomainArr) return

  analyser.getByteFrequencyData(frequencyDataArr)
  analyser.getByteTimeDomainData(timeDomainArr)

  const beat = computeBeat(frequencyDataArr)
  const volume = computeVolume(timeDomainArr)

  useAudioStore.getState().update(frequencyDataArr, timeDomainArr, beat, volume)

  animationFrameId = requestAnimationFrame(loop)
}

export async function loadAudio(file: File): Promise<void> {
  if (sourceNode) {
    sourceNode.stop()
    sourceNode.disconnect()
    sourceNode = null
  }

  const ctx = getAudioContext()
  if (ctx.state === 'suspended') await ctx.resume()

  const arrayBuffer = await file.arrayBuffer()
  audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0))

  useAudioStore.getState().setFileInfo(file.name, audioBuffer.duration)

  startPlayback()
}

export function startPlayback(): void {
  const ctx = getAudioContext()
  if (!analyser || !gainNode || !audioBuffer) return

  if (sourceNode) {
    try {
      sourceNode.stop()
    } catch {
      // ignore
    }
    sourceNode.disconnect()
  }

  sourceNode = ctx.createBufferSource()
  sourceNode.buffer = audioBuffer
  sourceNode.loop = true
  sourceNode.connect(analyser)
  analyser.connect(gainNode)
  gainNode.connect(ctx.destination)
  sourceNode.start(0)

  useAudioStore.getState().setPlaying(true)

  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  loop()
}

export function stopPlayback(): void {
  if (sourceNode) {
    try {
      sourceNode.stop()
    } catch {
      // ignore
    }
    sourceNode.disconnect()
    sourceNode = null
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  useAudioStore.getState().setPlaying(false)
  useAudioStore.getState().update(
    new Uint8Array(FFT_SIZE / 2),
    new Uint8Array(FFT_SIZE / 2),
    0,
    0
  )
}

export function setVolume(vol: number): void {
  if (gainNode) {
    gainNode.gain.value = Math.max(0, Math.min(1, vol))
  }
}

export function isAudioLoaded(): boolean {
  return audioBuffer !== null
}
