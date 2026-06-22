import { create } from 'zustand'
import {
  type TrainingMode,
  type WaveType,
  type NoteName,
  type Question,
  type IntervalQuestion,
  type ChordQuestion,
  type ScaleQuestion,
  ALL_NOTES,
  INTERVAL_NAMES,
  CHORD_TYPES,
  SCALE_TYPES,
  getNoteIndex,
  buildNotesFromRoot,
} from '@/types'
import { audioEngine } from '@/audio/AudioEngine'

interface GameState {
  mode: TrainingMode
  waveType: WaveType
  currentQuestion: Question | null
  score: number
  totalQuestions: number
  correctAnswers: number
  selectedNotes: NoteName[]
  feedback: 'correct' | 'incorrect' | null
  showAnswer: boolean
  roundSize: number
  selectedScale: { rootNote: NoteName; scaleIndex: number } | null
  isPlayingScale: boolean
  isRoundComplete: boolean

  setMode: (mode: TrainingMode) => void
  setWaveType: (waveType: WaveType) => void
  selectNote: (note: NoteName) => void
  checkAnswer: () => void
  nextQuestion: () => void
  replayQuestion: () => void
  resetRound: () => void
  setSelectedScale: (rootNote: NoteName, scaleIndex: number) => void
  playScaleSequence: () => void
  startNewRound: () => void
}

function generateIntervalQuestion(): IntervalQuestion {
  const note1 = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)]
  const semitones = Math.floor(Math.random() * 12) + 1
  const note2Index = (getNoteIndex(note1) + semitones) % 12
  const note2 = ALL_NOTES[note2Index]
  return {
    type: 'interval',
    note1,
    note2,
    intervalName: INTERVAL_NAMES[semitones],
    semitones,
  }
}

function generateChordQuestion(): ChordQuestion {
  const root = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)]
  const chordType = CHORD_TYPES[Math.floor(Math.random() * CHORD_TYPES.length)]
  const notes = buildNotesFromRoot(root, chordType.intervals.slice(1))
  return {
    type: 'chord',
    notes: [root, ...notes.slice(0, -1)],
    chordName: `${root} ${chordType.name}`,
  }
}

function generateQuestion(mode: TrainingMode): Question {
  switch (mode) {
    case 'interval':
      return generateIntervalQuestion()
    case 'chord':
      return generateChordQuestion()
    case 'scale': {
      const root = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)]
      const scaleType = SCALE_TYPES[Math.floor(Math.random() * SCALE_TYPES.length)]
      const notes = buildNotesFromRoot(root, scaleType.intervals)
      return {
        type: 'scale',
        rootNote: root,
        scaleName: `${root} ${scaleType.name}`,
        notes,
      }
    }
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'interval',
  waveType: 'sine',
  currentQuestion: null,
  score: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  selectedNotes: [],
  feedback: null,
  showAnswer: false,
  roundSize: 10,
  selectedScale: null,
  isPlayingScale: false,
  isRoundComplete: false,

  setMode: (mode) => {
    set({
      mode,
      currentQuestion: null,
      selectedNotes: [],
      feedback: null,
      showAnswer: false,
      isRoundComplete: false,
    })
    const q = generateQuestion(mode)
    set({ currentQuestion: q })
    const state = get()
    if (mode === 'interval' && q.type === 'interval') {
      audioEngine.playInterval(q.note1, q.note2, state.waveType)
    } else if (mode === 'chord' && q.type === 'chord') {
      audioEngine.playChord(q.notes, state.waveType)
    }
  },

  setWaveType: (waveType) => {
    set({ waveType })
  },

  selectNote: (note) => {
    const state = get()
    if (state.showAnswer) return
    if (state.mode === 'scale') return

    if (state.mode === 'interval') {
      if (state.selectedNotes.length === 0) {
        set({ selectedNotes: [note] })
        audioEngine.playNote(note, state.waveType)
      } else if (state.selectedNotes.length === 1) {
        set({ selectedNotes: [state.selectedNotes[0], note] })
        audioEngine.playNote(note, state.waveType)
        get().checkAnswer()
      }
    } else if (state.mode === 'chord') {
      const newSelected = state.selectedNotes.includes(note)
        ? state.selectedNotes.filter((n) => n !== note)
        : [...state.selectedNotes, note]
      set({ selectedNotes: newSelected })
      audioEngine.playNote(note, state.waveType, 0.3)
    }
  },

  checkAnswer: () => {
    const state = get()
    if (!state.currentQuestion || state.showAnswer) return
    if (state.selectedNotes.length === 0) return

    const q = state.currentQuestion
    let isCorrect = false

    if (q.type === 'interval') {
      const selectedSemitones =
        ((getNoteIndex(state.selectedNotes[1]) - getNoteIndex(state.selectedNotes[0])) + 12) % 12
      isCorrect = selectedSemitones === q.semitones
    } else if (q.type === 'chord') {
      const correctSet = new Set(q.notes)
      const selectedSet = new Set(state.selectedNotes)
      isCorrect =
        correctSet.size === selectedSet.size &&
        [...correctSet].every((n) => selectedSet.has(n))
    }

    const newTotal = state.totalQuestions + 1
    const newCorrect = isCorrect ? state.correctAnswers + 1 : state.correctAnswers
    const newScore = isCorrect ? state.score + 10 : state.score
    const roundComplete = newTotal >= state.roundSize

    set({
      feedback: isCorrect ? 'correct' : 'incorrect',
      showAnswer: true,
      score: newScore,
      totalQuestions: newTotal,
      correctAnswers: newCorrect,
      isRoundComplete: roundComplete,
    })

    if (!isCorrect && q.type === 'chord') {
      audioEngine.playChord(q.notes, state.waveType)
    }
  },

  nextQuestion: () => {
    const state = get()
    if (state.isRoundComplete) return
    const q = generateQuestion(state.mode)
    set({
      currentQuestion: q,
      selectedNotes: [],
      feedback: null,
      showAnswer: false,
    })
    if (state.mode === 'interval' && q.type === 'interval') {
      audioEngine.playInterval(q.note1, q.note2, state.waveType)
    } else if (state.mode === 'chord' && q.type === 'chord') {
      audioEngine.playChord(q.notes, state.waveType)
    }
  },

  replayQuestion: () => {
    const state = get()
    const q = state.currentQuestion
    if (!q) return
    if (q.type === 'interval') {
      audioEngine.playInterval(q.note1, q.note2, state.waveType)
    } else if (q.type === 'chord') {
      audioEngine.playChord(q.notes, state.waveType)
    }
  },

  resetRound: () => {
    set({
      score: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      selectedNotes: [],
      feedback: null,
      showAnswer: false,
      isRoundComplete: false,
    })
    const state = get()
    const q = generateQuestion(state.mode)
    set({ currentQuestion: q })
    if (state.mode === 'interval' && q.type === 'interval') {
      audioEngine.playInterval(q.note1, q.note2, state.waveType)
    } else if (state.mode === 'chord' && q.type === 'chord') {
      audioEngine.playChord(q.notes, state.waveType)
    }
  },

  setSelectedScale: (rootNote, scaleIndex) => {
    const scaleType = SCALE_TYPES[scaleIndex]
    const notes = buildNotesFromRoot(rootNote, scaleType.intervals)
    const q: ScaleQuestion = {
      type: 'scale',
      rootNote,
      scaleName: `${rootNote} ${scaleType.name}`,
      notes,
    }
    set({
      selectedScale: { rootNote, scaleIndex },
      currentQuestion: q,
      selectedNotes: [],
      feedback: null,
      showAnswer: false,
    })
  },

  playScaleSequence: () => {
    const state = get()
    if (!state.currentQuestion || state.currentQuestion.type !== 'scale') return
    if (state.isPlayingScale) return
    set({ isPlayingScale: true })
    const q = state.currentQuestion as ScaleQuestion
    audioEngine.playScale(q.notes, state.waveType)
    const totalDuration = q.notes.length * 0.45 * 1000
    setTimeout(() => {
      set({ isPlayingScale: false })
    }, totalDuration)
  },

  startNewRound: () => {
    set({
      score: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      selectedNotes: [],
      feedback: null,
      showAnswer: false,
      isRoundComplete: false,
    })
    const state = get()
    const q = generateQuestion(state.mode)
    set({ currentQuestion: q })
    if (state.mode === 'interval' && q.type === 'interval') {
      audioEngine.playInterval(q.note1, q.note2, state.waveType)
    } else if (state.mode === 'chord' && q.type === 'chord') {
      audioEngine.playChord(q.notes, state.waveType)
    }
  },
}))
