export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const MIDI_NOTE_MIN = 21
export const MIDI_NOTE_MAX = 108
export const TOTAL_KEYS = MIDI_NOTE_MAX - MIDI_NOTE_MIN + 1

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${NOTE_NAMES[noteIndex]}${octave}`
}

export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(-?\d+)$/)
  if (!match) throw new Error(`Invalid note name: ${noteName}`)
  const [, note, octaveStr] = match
  const octave = parseInt(octaveStr, 10)
  const noteIndex = NOTE_NAMES.indexOf(note)
  if (noteIndex === -1) throw new Error(`Invalid note: ${note}`)
  return (octave + 1) * 12 + noteIndex
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function isBlackKey(midi: number): boolean {
  const noteIndex = midi % 12
  return [1, 3, 6, 8, 10].includes(noteIndex)
}

export function getMidiIndex(midi: number): number {
  return MIDI_NOTE_MAX - midi
}

export function midiFromIndex(index: number): number {
  return MIDI_NOTE_MAX - index
}

export type NoteValue = '1n' | '2n' | '4n' | '8n' | '16n' | '32n'

export const NOTE_VALUES: NoteValue[] = ['1n', '2n', '4n', '8n', '16n', '32n']

export function noteValueToTicks(value: NoteValue, ppq: number = 192): number {
  const multipliers: Record<NoteValue, number> = {
    '1n': 4,
    '2n': 2,
    '4n': 1,
    '8n': 0.5,
    '16n': 0.25,
    '32n': 0.125,
  }
  return ppq * multipliers[value]
}

export function ticksToNoteValue(ticks: number, ppq: number = 192): NoteValue {
  const quarterNotes = ticks / ppq
  if (quarterNotes >= 4) return '1n'
  if (quarterNotes >= 2) return '2n'
  if (quarterNotes >= 1) return '4n'
  if (quarterNotes >= 0.5) return '8n'
  if (quarterNotes >= 0.25) return '16n'
  return '32n'
}

export type ScaleType = 'major' | 'minor' | 'pentatonic' | 'blues'

export const SCALES: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
}

export function getScaleNotes(rootMidi: number, scaleType: ScaleType): number[] {
  const intervals = SCALES[scaleType]
  const notes: number[] = []
  for (let octave = 0; octave < 10; octave++) {
    for (const interval of intervals) {
      const midi = rootMidi + octave * 12 + interval
      if (midi >= MIDI_NOTE_MIN && midi <= MIDI_NOTE_MAX) {
        notes.push(midi)
      }
    }
  }
  return notes
}

export function snapToScale(midi: number, rootMidi: number, scaleType: ScaleType): number {
  const scaleNotes = getScaleNotes(rootMidi, scaleType)
  if (scaleNotes.length === 0) return midi
  let closest = scaleNotes[0]
  let minDist = Math.abs(midi - closest)
  for (const note of scaleNotes) {
    const dist = Math.abs(midi - note)
    if (dist < minDist) {
      minDist = dist
      closest = note
    }
  }
  return closest
}

export function noteColorGradient(midi: number): string {
  const t = (midi - MIDI_NOTE_MIN) / (MIDI_NOTE_MAX - MIDI_NOTE_MIN)
  const r = Math.round(60 + t * 200)
  const g = Math.round(80 + (1 - Math.abs(t - 0.5) * 2) * 100)
  const b = Math.round(220 - t * 180)
  return `rgb(${r}, ${g}, ${b})`
}

export function noteColorGradientHex(midi: number): string {
  const t = (midi - MIDI_NOTE_MIN) / (MIDI_NOTE_MAX - MIDI_NOTE_MIN)
  const r = Math.round(60 + t * 200).toString(16).padStart(2, '0')
  const g = Math.round(80 + (1 - Math.abs(t - 0.5) * 2) * 100).toString(16).padStart(2, '0')
  const b = Math.round(220 - t * 180).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}
