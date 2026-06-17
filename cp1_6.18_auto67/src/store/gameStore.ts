import { create } from 'zustand'
import type { Difficulty } from '@/shared/utils'
import type { Word } from '@/api/wordsApi'

type AnswerRecord = {
  wordId: string
  correct: boolean
  mode: 'spelling' | 'matching'
}

interface GameState {
  screen: 'start' | 'playing' | 'levelComplete' | 'gameOver'
  currentLevel: number
  currentDifficulty: Difficulty
  lives: number
  totalCorrect: number
  totalAnswered: number
  currentWordIndex: number
  currentWords: Word[]
  levelCorrect: number
  userInputHistory: AnswerRecord[]
  farLevel: number
  totalScore: number
  loading: boolean

  startGame: () => void
  startLevel: () => Promise<void>
  submitAnswer: (
    wordId: string,
    correct: boolean,
    mode: 'spelling' | 'matching'
  ) => { nextScreen: GameState['screen'] }
  adjustDifficulty: (correctRate: number) => void
  goToScreen: (screen: GameState['screen']) => void
  nextLevel: () => void
}

const initialState: Omit<
  GameState,
  | 'startGame'
  | 'startLevel'
  | 'submitAnswer'
  | 'adjustDifficulty'
  | 'goToScreen'
  | 'nextLevel'
> = {
  screen: 'start',
  currentLevel: 1,
  currentDifficulty: '初级',
  lives: 3,
  totalCorrect: 0,
  totalAnswered: 0,
  currentWordIndex: 0,
  currentWords: [],
  levelCorrect: 0,
  userInputHistory: [],
  farLevel: 0,
  totalScore: 0,
  loading: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  startGame: () => {
    set({ ...initialState })
  },

  startLevel: async () => {
    set({ loading: true })
    try {
      const { default: api } = await import('@/api/wordsApi')
      const words = await api.fetchWords(get().currentDifficulty, 10)
      set({
        currentWords: words,
        currentWordIndex: 0,
        levelCorrect: 0,
        screen: 'playing',
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  submitAnswer: (wordId, correct, mode) => {
    const state = get()
    const newTotalAnswered = state.totalAnswered + 1
    const newTotalCorrect = correct ? state.totalCorrect + 1 : state.totalCorrect
    const newLevelCorrect = correct ? state.levelCorrect + 1 : state.levelCorrect
    const newTotalScore = correct ? state.totalScore + 10 : state.totalScore
    const newLives = correct ? state.lives : state.lives - 1
    const newHistory = [...state.userInputHistory, { wordId, correct, mode }]

    const levelFinished = state.currentWordIndex >= state.currentWords.length - 1

    let nextScreen: GameState['screen'] = 'playing'
    let nextWordIndex = state.currentWordIndex

    if (newLives <= 0) {
      nextScreen = 'gameOver'
    } else if (levelFinished) {
      nextScreen = 'levelComplete'
    } else {
      nextWordIndex = state.currentWordIndex + 1
    }

    set({
      totalAnswered: newTotalAnswered,
      totalCorrect: newTotalCorrect,
      levelCorrect: newLevelCorrect,
      totalScore: newTotalScore,
      lives: newLives,
      userInputHistory: newHistory,
      currentWordIndex: nextWordIndex,
      screen: nextScreen,
    })

    return { nextScreen }
  },

  adjustDifficulty: (correctRate) => {
    import('@/shared/utils').then(({ classifyDifficulty }) => {
      const newDifficulty = classifyDifficulty(get().currentDifficulty, correctRate)
      set({ currentDifficulty: newDifficulty })
    })
  },

  goToScreen: (screen) => {
    set({ screen })
  },

  nextLevel: () => {
    const state = get()
    const newLevel = state.currentLevel + 1
    set({
      currentLevel: newLevel,
      farLevel: Math.max(state.farLevel, newLevel),
      levelCorrect: 0,
      currentWordIndex: 0,
    })
  },
}))
