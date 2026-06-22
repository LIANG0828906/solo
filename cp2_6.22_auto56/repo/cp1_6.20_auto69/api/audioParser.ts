import WaveFile from 'wavefile'
import FFT from 'fft.js'

export interface SpectrumData {
  duration: number
  frameCount: number
  frameRate: number
  binsPerFrame: number
  frames: number[][]
}

const FRAME_RATE = 20
const BINS_PER_FRAME = 128
const FFT_SIZE = BINS_PER_FRAME * 2

export async function parseAudioBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<SpectrumData> {
  if (mimeType.includes('wav') || mimeType === 'audio/wav' || mimeType === 'audio/x-wav') {
    return parseWav(buffer)
  }

  if (mimeType.includes('mp3') || mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') {
    return generateMockSpectrum(30)
  }

  throw new Error(`Unsupported audio format: ${mimeType}`)
}

function parseWav(buffer: Buffer): SpectrumData {
  const wav = new WaveFile()
  wav.fromBuffer(new Uint8Array(buffer))

  const samplesResult = wav.getSamples(false, Float64Array)
  const sampleRate = (wav.fmt as any).sampleRate as number
  const numChannels = (wav.fmt as any).numChannels as number

  const samples = Array.isArray(samplesResult) ? samplesResult : [samplesResult]

  const monoSamples = numChannels > 1
    ? mixToMono(samples)
    : samples[0]

  const duration = monoSamples.length / sampleRate
  const samplesPerFrame = Math.floor(sampleRate / FRAME_RATE)
  const frameCount = Math.floor(monoSamples.length / samplesPerFrame)

  const fft = new FFT(FFT_SIZE)
  const window = createHannWindow(FFT_SIZE)
  const frames: number[][] = []

  let maxMagnitude = 0

  for (let i = 0; i < frameCount; i++) {
    const start = i * samplesPerFrame
    const frameSamples = new Float64Array(FFT_SIZE)

    for (let j = 0; j < FFT_SIZE && start + j < monoSamples.length; j++) {
      frameSamples[j] = monoSamples[start + j] * window[j]
    }

    const complexOut = fft.createComplexArray()
    fft.realTransform(complexOut, frameSamples)
    fft.completeSpectrum(complexOut)

    const magnitudes = extractMagnitudes(complexOut, BINS_PER_FRAME)
    frames.push(magnitudes)

    const frameMax = Math.max(...magnitudes)
    if (frameMax > maxMagnitude) {
      maxMagnitude = frameMax
    }
  }

  const normalizedFrames = frames.map(frame =>
    frame.map(mag => maxMagnitude > 0 ? Math.min(mag / maxMagnitude, 1) : 0),
  )

  return {
    duration,
    frameCount,
    frameRate: FRAME_RATE,
    binsPerFrame: BINS_PER_FRAME,
    frames: normalizedFrames,
  }
}

function mixToMono(channels: Float64Array[]): Float64Array {
  const length = channels[0].length
  const mono = new Float64Array(length)

  for (let i = 0; i < length; i++) {
    let sum = 0
    for (const channel of channels) {
      sum += channel[i]
    }
    mono[i] = sum / channels.length
  }

  return mono
}

function createHannWindow(size: number): Float64Array {
  const window = new Float64Array(size)
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)))
  }
  return window
}

function extractMagnitudes(complex: number[], bins: number): number[] {
  const magnitudes: number[] = []
  for (let i = 0; i < bins; i++) {
    const real = complex[i * 2]
    const imag = complex[i * 2 + 1]
    magnitudes.push(Math.sqrt(real * real + imag * imag))
  }
  return magnitudes
}

function generateMockSpectrum(duration: number): SpectrumData {
  const frameCount = Math.floor(duration * FRAME_RATE)
  const frames: number[][] = []

  for (let i = 0; i < frameCount; i++) {
    const frame: number[] = []
    const t = i / FRAME_RATE

    for (let j = 0; j < BINS_PER_FRAME; j++) {
      const freq = (j / BINS_PER_FRAME) * 10
      const base = Math.sin(freq + t * 2) * 0.3 + 0.5
      const noise = Math.random() * 0.2
      const envelope = Math.sin((t / duration) * Math.PI)
      frame.push(Math.min(Math.max(base * envelope + noise, 0), 1))
    }

    frames.push(frame)
  }

  return {
    duration,
    frameCount,
    frameRate: FRAME_RATE,
    binsPerFrame: BINS_PER_FRAME,
    frames,
  }
}
