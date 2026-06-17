export interface PianoKey {
  note: string
  freq: number
  isBlack: boolean
  keyBinding: string
  x: number
  whiteKeyIndex: number
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const WHITE_KEY_BINDINGS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Q', 'W', 'E', 'R']
const BLACK_KEY_BINDINGS = ['W', 'E', 'T', 'Y', 'U', 'O', 'P', ']', '\\', '1', '2', '4', '5', '6', '8', '9', '-', '=']
const WHITE_KEY_WIDTH = 30
const BLACK_KEY_WIDTH = 18
const BLACK_KEY_HEIGHT = 75

const noteToFreq = (note: string, octave: number): number => {
  const noteIndex = NOTE_NAMES.indexOf(note)
  const semitonesFromA4 = (octave - 4) * 12 + noteIndex - 9
  return 440 * Math.pow(2, semitonesFromA4 / 12)
}

const getNoteColor = (noteIndex: number, totalNotes: number): string => {
  const hue = (noteIndex / (totalNotes - 1)) * 300
  return `hsl(${hue}, 80%, 60%)`
}

export const generatePianoKeys = (): PianoKey[] => {
  const keys: PianoKey[] = []
  let whiteKeyIndex = 0
  const startOctave = 3
  const endOctave = 6
  const endNoteIndex = 6

  const noteIndices: { note: string; octave: number; isBlack: boolean }[] = []

  for (let octave = startOctave; octave <= endOctave; octave++) {
    for (let i = 0; i < 12; i++) {
      if (octave === endOctave && i > endNoteIndex) break
      const note = NOTE_NAMES[i]
      const isBlack = note.includes('#')
      noteIndices.push({ note, octave, isBlack })
    }
  }

  let whiteBindingIndex = 0
  let blackBindingIndex = 0

  for (let i = 0; i < noteIndices.length; i++) {
    const { note, octave, isBlack } = noteIndices[i]
    const fullNote = `${note}${octave}`
    const freq = noteToFreq(note, octave)
    
    let x: number
    if (isBlack) {
      x = whiteKeyIndex * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2
    } else {
      x = whiteKeyIndex * WHITE_KEY_WIDTH
      whiteKeyIndex++
    }

    const keyBinding = isBlack 
      ? (blackBindingIndex < BLACK_KEY_BINDINGS.length ? BLACK_KEY_BINDINGS[blackBindingIndex++] : '')
      : (whiteBindingIndex < WHITE_KEY_BINDINGS.length ? WHITE_KEY_BINDINGS[whiteBindingIndex++] : '')

    keys.push({
      note: fullNote,
      freq,
      isBlack,
      keyBinding,
      x,
      whiteKeyIndex: isBlack ? whiteKeyIndex - 1 : whiteKeyIndex - 1,
    })
  }

  return keys
}

export const PIANO_KEYS = generatePianoKeys()
export const WHITE_KEYS_COUNT = PIANO_KEYS.filter(k => !k.isBlack).length
export const TOTAL_WIDTH = WHITE_KEYS_COUNT * WHITE_KEY_WIDTH
export const getColorForNote = (note: string): string => {
  const index = PIANO_KEYS.findIndex(k => k.note === note)
  return getNoteColor(index, PIANO_KEYS.length)
}

export { WHITE_KEY_WIDTH, BLACK_KEY_WIDTH, BLACK_KEY_HEIGHT }
