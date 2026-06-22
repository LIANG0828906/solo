import { v4 as uuidv4 } from 'uuid'
import type { AudioStyle } from './store'

const API_BASE = '/api'

export async function uploadVideo(
  file: File,
  onProgress: (progress: number) => void
): Promise<{
  id: string
  filename: string
  duration: number
  url: string
  thumbnailUrl: string
}> {
  return new Promise((resolve, reject) => {
    const fileId = uuidv4()
    const videoUrl = URL.createObjectURL(file)

    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true

    video.onloadedmetadata = () => {
      const duration = video.duration

      video.currentTime = Math.min(1, duration / 2)
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 120
      canvas.height = 68
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, 120, 68)
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7)

      simulateUpload(file, onProgress).then(() => {
        resolve({
          id: fileId,
          filename: file.name,
          duration,
          url: videoUrl,
          thumbnailUrl,
        })
      })
    }

    video.onerror = () => {
      simulateUpload(file, onProgress).then(() => {
        resolve({
          id: fileId,
          filename: file.name,
          duration: 0,
          url: videoUrl,
          thumbnailUrl: '',
        })
      })
    }

    video.src = videoUrl

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileId', fileId)

      fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      }).catch(() => {})
    } catch {
      // Server upload is optional for browser-based editing
    }
  })
}

function simulateUpload(
  file: File,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    const totalSteps = 30
    const interval = file.size / (1024 * 1024) > 10 ? 66 : 33
    let step = 0

    const timer = setInterval(() => {
      step++
      const progress = Math.min((step / totalSteps) * 100, 100)
      onProgress(progress)

      if (step >= totalSteps) {
        clearInterval(timer)
        resolve()
      }
    }, interval)
  })
}

export interface AudioInfo {
  style: AudioStyle
  label: string
  url: string
}

const AUDIO_STYLES: AudioInfo[] = [
  { style: 'light', label: '轻快', url: `${API_BASE}/audio/light` },
  { style: 'soothing', label: '舒缓', url: `${API_BASE}/audio/soothing` },
  { style: 'suspense', label: '悬疑', url: `${API_BASE}/audio/suspense` },
  { style: 'intense', label: '激昂', url: `${API_BASE}/audio/intense` },
  { style: 'romantic', label: '浪漫', url: `${API_BASE}/audio/romantic` },
]

export function getAudioStyles(): AudioInfo[] {
  return AUDIO_STYLES
}

export function generateAudioOscillator(
  audioContext: AudioContext,
  style: AudioStyle
): OscillatorNode {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  const configs: Record<AudioStyle, { type: OscillatorType; freq: number; gain: number }> = {
    light: { type: 'sine', freq: 523.25, gain: 0.15 },
    soothing: { type: 'sine', freq: 261.63, gain: 0.12 },
    suspense: { type: 'sawtooth', freq: 196.0, gain: 0.08 },
    intense: { type: 'square', freq: 440.0, gain: 0.1 },
    romantic: { type: 'triangle', freq: 329.63, gain: 0.13 },
  }

  const config = configs[style]
  oscillator.type = config.type
  oscillator.frequency.setValueAtTime(config.freq, audioContext.currentTime)
  gainNode.gain.setValueAtTime(config.gain, audioContext.currentTime)

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  return oscillator
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
