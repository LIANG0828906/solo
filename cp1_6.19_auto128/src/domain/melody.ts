import type { Note, MelodyTrack, InstrumentType } from '../eventBus'

export { Note, MelodyTrack, InstrumentType }

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${NOTE_NAMES[noteIndex]}${octave}`
}

export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(-?\d)$/)
  if (!match) return 60
  const [, note, octaveStr] = match
  const octave = parseInt(octaveStr, 10)
  const noteIndex = NOTE_NAMES.indexOf(note)
  if (noteIndex === -1) return 60
  return (octave + 1) * 12 + noteIndex
}

export function createMelody(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => a.time - b.time || a.midi - b.midi)
}

export function transposeMelody(notes: Note[], semitones: number): Note[] {
  return notes.map(note => ({
    ...note,
    midi: Math.max(0, Math.min(127, note.midi + semitones))
  }))
}

export function createNote(midi: number, time: number, duration: number = 0.25, velocity: number = 0.8): Note {
  return { midi, time, duration, velocity }
}

export function generateWaveformData(notes: Note[], width: number, height: number, totalBeats: number): number[] {
  const samples: number[] = new Array(width).fill(0)
  
  if (notes.length === 0) return samples

  for (let i = 0; i < width; i++) {
    const beat = (i / width) * totalBeats
    let maxAmp = 0

    for (const note of notes) {
      if (beat >= note.time && beat < note.time + note.duration) {
        const progress = (beat - note.time) / note.duration
        const envelope = Math.sin(progress * Math.PI)
        const amp = note.velocity * envelope
        if (amp > maxAmp) maxAmp = amp
      }
    }

    samples[i] = maxAmp * (height / 2)
  }

  return samples
}

export function generateCombinedWaveform(tracks: MelodyTrack[], width: number, height: number, totalBeats: number): number[] {
  const samples: number[] = new Array(width).fill(0)
  
  for (const track of tracks) {
    if (track.mute) continue
    const trackSamples = generateWaveformData(track.notes, width, height, totalBeats)
    for (let i = 0; i < width; i++) {
      samples[i] += trackSamples[i] * track.volume
    }
  }

  const maxSample = Math.max(...samples, 1)
  return samples.map(s => (s / maxSample) * (height / 2))
}

export function getNoteColor(midi: number, minMidi: number = 36, maxMidi: number = 96): string {
  const clampedMidi = Math.max(minMidi, Math.min(maxMidi, midi))
  const ratio = (clampedMidi - minMidi) / (maxMidi - minMidi)
  
  const r1 = 52, g1 = 152, b1 = 219
  const r2 = 231, g2 = 76, b2 = 60
  
  const r = Math.round(r1 + (r2 - r1) * ratio)
  const g = Math.round(g1 + (g2 - g1) * ratio)
  const b = Math.round(b1 + (b2 - b1) * ratio)
  
  return `rgb(${r}, ${g}, ${b})`
}

export const INSTRUMENT_NAMES: Record<InstrumentType, string> = {
  piano: '钢琴',
  guitar: '吉他',
  bass: '贝斯',
  drums: '电子鼓',
  strings: '弦乐',
  synth: '合成器'
}

export const INSTRUMENT_COLORS: Record<InstrumentType, string> = {
  piano: '#8B5CF6',
  guitar: '#10B981',
  bass: '#F59E0B',
  drums: '#EF4444',
  strings: '#EC4899',
  synth: '#06B6D4'
}

export function createEmptyTrack(id: string, instrument: InstrumentType = 'piano'): MelodyTrack {
  return {
    id,
    name: `${INSTRUMENT_NAMES[instrument]} 音轨`,
    instrument,
    notes: [],
    volume: 0.8,
    pan: 0,
    mute: false,
    solo: false,
    reverb: 0.2,
    delay: 0
  }
}

export function getTotalDuration(notes: Note[]): number {
  if (notes.length === 0) return 0
  return Math.max(...notes.map(n => n.time + n.duration))
}
