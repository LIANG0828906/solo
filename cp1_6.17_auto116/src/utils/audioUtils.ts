import type { FrequencyBands } from '@/types'

export function calculateFrequencyBands(frequencyData: Uint8Array, sampleRate: number): FrequencyBands {
  const fftSize = frequencyData.length * 2
  const nyquist = sampleRate / 2
  const binSize = nyquist / frequencyData.length

  const lowStart = Math.floor(20 / binSize)
  const lowEnd = Math.floor(250 / binSize)
  const midStart = Math.floor(250 / binSize)
  const midEnd = Math.floor(2000 / binSize)
  const highStart = Math.floor(2000 / binSize)
  const highEnd = Math.floor(20000 / binSize)

  let lowSum = 0
  let lowCount = 0
  for (let i = lowStart; i <= lowEnd && i < frequencyData.length; i++) {
    lowSum += frequencyData[i]
    lowCount++
  }

  let midSum = 0
  let midCount = 0
  for (let i = midStart; i <= midEnd && i < frequencyData.length; i++) {
    midSum += frequencyData[i]
    midCount++
  }

  let highSum = 0
  let highCount = 0
  for (let i = highStart; i <= highEnd && i < frequencyData.length; i++) {
    highSum += frequencyData[i]
    highCount++
  }

  return {
    low: lowCount > 0 ? lowSum / lowCount / 255 : 0,
    mid: midCount > 0 ? midSum / midCount / 255 : 0,
    high: highCount > 0 ? highSum / highCount / 255 : 0,
  }
}

export function getLowFrequencyEnergy(frequencyData: Uint8Array, sampleRate: number): number {
  const nyquist = sampleRate / 2
  const binSize = nyquist / frequencyData.length
  const lowEnd = Math.floor(100 / binSize)

  let sum = 0
  let count = 0
  for (let i = 0; i <= lowEnd && i < frequencyData.length; i++) {
    sum += frequencyData[i]
    count++
  }
  return count > 0 ? sum / count / 255 : 0
}

export function getMidFrequencyEnergy(frequencyData: Uint8Array, sampleRate: number): number {
  const nyquist = sampleRate / 2
  const binSize = nyquist / frequencyData.length
  const midStart = Math.floor(200 / binSize)
  const midEnd = Math.floor(2000 / binSize)

  let sum = 0
  let count = 0
  for (let i = midStart; i <= midEnd && i < frequencyData.length; i++) {
    sum += frequencyData[i]
    count++
  }
  return count > 0 ? sum / count / 255 : 0
}

export function getHighFrequencyEnergy(frequencyData: Uint8Array, sampleRate: number): number {
  const nyquist = sampleRate / 2
  const binSize = nyquist / frequencyData.length
  const highStart = Math.floor(2000 / binSize)
  const highEnd = Math.floor(20000 / binSize)

  let sum = 0
  let count = 0
  for (let i = highStart; i <= highEnd && i < frequencyData.length; i++) {
    sum += frequencyData[i]
    count++
  }
  return count > 0 ? sum / count / 255 : 0
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
