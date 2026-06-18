type EventCallback<T = unknown> = (data: T) => void

type EventMap = {
  addTrack: { id: string; instrument: InstrumentType; notes: Note[] }
  removeTrack: { id: string }
  updateTrack: { id: string; volume?: number; pan?: number; mute?: boolean; reverb?: number; delay?: number }
  updateNotes: { id: string; notes: Note[] }
  mixTrack: { masterVolume: number; masterReverb: number; masterDelay: number }
  playAll: { bpm: number; loop: boolean }
  stopAll: void
  pauseAll: void
  seekTo: { time: number }
  setBpm: { bpm: number }
  exportWav: void
  playbackProgress: { time: number; duration: number }
  playbackState: { isPlaying: boolean }
  exportProgress: { progress: number }
  exportComplete: { url: string; blob: Blob }
  tracksChanged: { tracks: MelodyTrack[] }
  openEditor: { trackId: string }
  closeEditor: void
  reorderTracks: { trackIds: string[] }
}

export type InstrumentType = 'piano' | 'guitar' | 'bass' | 'drums' | 'strings' | 'synth'

export interface Note {
  midi: number
  time: number
  duration: number
  velocity: number
}

export interface MelodyTrack {
  id: string
  name: string
  instrument: InstrumentType
  notes: Note[]
  volume: number
  pan: number
  mute: boolean
  solo: boolean
  reverb: number
  delay: number
}

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as EventCallback)

    return () => {
      this.off(event, callback as EventCallback)
    }
  }

  off<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(callback as EventCallback)
    }
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (e) {
          console.error(`Error in event listener for "${event}":`, e)
        }
      })
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()
export default eventBus
