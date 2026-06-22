import type { WaveformData } from './AudioWaveform'

export interface Marker {
  id: string
  time: number
  text: string
  color: string
}

export interface BeatGrid {
  bpm: number
  timeSignature: number
  beatTimes: number[]
}

export interface Selection {
  start: number
  end: number
}

type SelectionCallback = (selection: Selection | null) => void
type MarkersCallback = (markers: Marker[]) => void

export const MARKER_COLORS = [
  '#E53935',
  '#FB8C00',
  '#FDD835',
  '#43A047',
  '#00BCD4',
  '#1E88E5',
  '#8E24AA',
  '#D81B60',
] as const

export class BeatMarkerManager {
  private markers: Marker[] = []
  private selection: Selection | null = null
  private selectionCallbacks: Set<SelectionCallback> = new Set()
  private markersCallbacks: Set<MarkersCallback> = new Set()

  calculateBeatGrid(waveformData: WaveformData, bpm?: number): BeatGrid {
    const { peaks, duration } = waveformData
    const timeSignature = 4

    let calculatedBpm = bpm || this.estimateBPM(peaks, duration)
    if (calculatedBpm < 60) calculatedBpm = 120
    if (calculatedBpm > 200) calculatedBpm = 120

    const beatInterval = 60 / calculatedBpm
    const beatTimes: number[] = []

    for (let time = 0; time <= duration; time += beatInterval) {
      beatTimes.push(time)
    }

    return {
      bpm: calculatedBpm,
      timeSignature,
      beatTimes,
    }
  }

  private estimateBPM(peaks: number[], duration: number): number {
    const energyThreshold = 0.6
    const beatCandidates: number[] = []

    for (let i = 0; i < peaks.length; i++) {
      if (peaks[i] > energyThreshold) {
        const time = (i / peaks.length) * duration
        beatCandidates.push(time)
      }
    }

    if (beatCandidates.length < 2) {
      return 120
    }

    const intervals: number[] = []
    for (let i = 1; i < beatCandidates.length; i++) {
      const interval = beatCandidates[i] - beatCandidates[i - 1]
      if (interval > 0.2 && interval < 2.0) {
        intervals.push(interval)
      }
    }

    if (intervals.length === 0) {
      return 120
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    return Math.round(60 / avgInterval)
  }

  addMarker(marker: Omit<Marker, 'id'>): Marker {
    const newMarker: Marker = {
      ...marker,
      id: this.generateId(),
    }
    this.markers.push(newMarker)
    this.sortMarkersByTime()
    this.notifyMarkersChange()
    return newMarker
  }

  removeMarker(id: string): void {
    this.markers = this.markers.filter((m) => m.id !== id)
    this.notifyMarkersChange()
  }

  updateMarker(id: string, updates: Partial<Marker>): Marker {
    const index = this.markers.findIndex((m) => m.id === id)
    if (index === -1) {
      throw new Error(`Marker with id ${id} not found`)
    }
    this.markers[index] = { ...this.markers[index], ...updates }
    this.sortMarkersByTime()
    this.notifyMarkersChange()
    return this.markers[index]
  }

  reorderMarkers(newOrder: string[]): void {
    const ordered: Marker[] = []
    const remaining: Marker[] = []

    for (const id of newOrder) {
      const marker = this.markers.find((m) => m.id === id)
      if (marker) {
        ordered.push(marker)
      }
    }

    for (const marker of this.markers) {
      if (!ordered.includes(marker)) {
        remaining.push(marker)
      }
    }

    this.markers = [...ordered, ...remaining]
    this.notifyMarkersChange()
  }

  getMarkers(): Marker[] {
    return [...this.markers]
  }

  setSelection(selection: Selection | null): void {
    this.selection = selection
    this.notifySelectionChange()
  }

  getSelection(): Selection | null {
    return this.selection
  }

  onSelectionChange(callback: SelectionCallback): () => void {
    this.selectionCallbacks.add(callback)
    return () => {
      this.selectionCallbacks.delete(callback)
    }
  }

  onMarkersChange(callback: MarkersCallback): () => void {
    this.markersCallbacks.add(callback)
    return () => {
      this.markersCallbacks.delete(callback)
    }
  }

  private sortMarkersByTime(): void {
    this.markers.sort((a, b) => a.time - b.time)
  }

  private generateId(): string {
    return `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private notifySelectionChange(): void {
    for (const callback of this.selectionCallbacks) {
      callback(this.selection)
    }
  }

  private notifyMarkersChange(): void {
    for (const callback of this.markersCallbacks) {
      callback(this.getMarkers())
    }
  }
}
