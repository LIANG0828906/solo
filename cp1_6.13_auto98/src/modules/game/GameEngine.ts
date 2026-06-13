import type { ColorItem, HSL } from '../color/ColorItem'
import { createColorItem } from '../color/ColorItem'
import {
  createDeviatedColor,
  generateRandomTargetHSL,
  isSameColor,
  shuffleArray,
} from '../color/utils'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_CONFIG = {
  easy:   { candidateCount: 4, deviationRange: [15, 30] as [number, number], label: '简单' },
  medium: { candidateCount: 6, deviationRange: [8, 15]  as [number, number], label: '中等' },
  hard:   { candidateCount: 8, deviationRange: [3, 8]   as [number, number], label: '困难' },
} as const

export const TOTAL_QUESTIONS = 10
export const SCORE_CORRECT = 10
export const SCORE_WRONG = -5
export const SCORE_COMBO_BONUS = 5

export interface QuestionResult {
  questionIndex: number
  targetColor: ColorItem
  selectedColor: ColorItem
  isCorrect: boolean
  reactionTimeMs: number
}

export interface GameRecord {
  id: string
  timestamp: number
  difficulty: Difficulty
  totalScore: number
  avgReactionTimeMs: number
  results: QuestionResult[]
}

export interface FeedbackState {
  selectedId: string
  isCorrect: boolean
  scoreDelta: number
  comboBonus: number
  combo: number
}

export interface GameState {
  isPlaying: boolean
  currentQuestionIndex: number
  targetColor: ColorItem
  candidateColors: ColorItem[]
  score: number
  combo: number
  questionStartTime: number
  lastResult: QuestionResult | null
  feedback: FeedbackState | null
  isRoundComplete: boolean
  difficulty: Difficulty
}

type StateListener = (state: GameState) => void

function generateRecordId(): string {
  return 'rec_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

export class GameEngine {
  private state: GameState
  private listeners: Set<StateListener> = new Set()
  private results: QuestionResult[] = []

  constructor(difficulty: Difficulty = 'medium') {
    this.state = this.createInitialState(difficulty)
  }

  private createInitialState(difficulty: Difficulty): GameState {
    const targetHSL = generateRandomTargetHSL()
    const targetColor = createColorItem(targetHSL)
    const candidateColors = this.generateCandidates(targetHSL, targetColor, difficulty)
    return {
      isPlaying: true,
      currentQuestionIndex: 0,
      targetColor,
      candidateColors,
      score: 0,
      combo: 0,
      questionStartTime: performance.now(),
      lastResult: null,
      feedback: null,
      isRoundComplete: false,
      difficulty,
    }
  }

  private generateCandidates(
    targetHSL: HSL,
    targetItem: ColorItem,
    difficulty: Difficulty,
  ): ColorItem[] {
    const cfg = DIFFICULTY_CONFIG[difficulty]
    const count = cfg.candidateCount
    const wrongCount = count - 1
    const wrongItems: ColorItem[] = []

    const usedHexes = new Set<string>([targetItem.hex])
    let attempts = 0
    const maxAttempts = wrongCount * 50

    while (wrongItems.length < wrongCount && attempts < maxAttempts) {
      attempts++
      const deviatedHSL = createDeviatedColor(targetHSL, cfg.deviationRange)
      const item = createColorItem(deviatedHSL)
      if (!usedHexes.has(item.hex)) {
        usedHexes.add(item.hex)
        wrongItems.push(item)
      }
    }

    while (wrongItems.length < wrongCount) {
      const h = (targetHSL.h + (wrongItems.length + 1) * 5) % 360
      const s = Math.max(50, targetHSL.s - (wrongItems.length + 1) * 2)
      const fallback = createColorItem({ h, s, l: targetHSL.l })
      if (!usedHexes.has(fallback.hex)) {
        usedHexes.add(fallback.hex)
        wrongItems.push(fallback)
      } else {
        wrongItems.push({ ...fallback, id: 'fallback_' + wrongItems.length })
      }
    }

    return shuffleArray([targetItem, ...wrongItems])
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn({ ...this.state }))
  }

  nextQuestion(): void {
    if (this.state.currentQuestionIndex >= TOTAL_QUESTIONS - 1) return
    const difficulty = this.state.difficulty
    const targetHSL = generateRandomTargetHSL()
    const targetColor = createColorItem(targetHSL)
    const candidateColors = this.generateCandidates(targetHSL, targetColor, difficulty)
    this.state = {
      ...this.state,
      currentQuestionIndex: this.state.currentQuestionIndex + 1,
      targetColor,
      candidateColors,
      questionStartTime: performance.now(),
      lastResult: null,
      feedback: null,
    }
    this.notify()
  }

  submitAnswer(selectedId: string): QuestionResult | null {
    if (this.state.feedback) return null
    const reactionTimeMs = Math.max(0, Math.round(performance.now() - this.state.questionStartTime))
    const selectedColor = this.state.candidateColors.find((c) => c.id === selectedId)
    if (!selectedColor) return null

    const isCorrect = isSameColor(selectedColor, this.state.targetColor)
    let scoreDelta = 0
    let comboBonus = 0
    let newCombo = this.state.combo

    if (isCorrect) {
      scoreDelta = SCORE_CORRECT
      newCombo = this.state.combo + 1
      if (newCombo > 1) {
        comboBonus = SCORE_COMBO_BONUS
        scoreDelta += comboBonus
      }
    } else {
      scoreDelta = SCORE_WRONG
      comboBonus = 0
      newCombo = 0
    }

    const result: QuestionResult = {
      questionIndex: this.state.currentQuestionIndex,
      targetColor: this.state.targetColor,
      selectedColor,
      isCorrect,
      reactionTimeMs,
    }
    this.results.push(result)

    const newScore = this.state.score + scoreDelta
    const nowRoundComplete = this.state.currentQuestionIndex >= TOTAL_QUESTIONS - 1

    this.state = {
      ...this.state,
      score: newScore,
      combo: newCombo,
      lastResult: result,
      feedback: { selectedId, isCorrect, scoreDelta, comboBonus, combo: newCombo },
      isRoundComplete: nowRoundComplete,
    }
    this.notify()
    return result
  }

  isRoundComplete(): boolean {
    return this.state.isRoundComplete
  }

  buildRecord(): GameRecord {
    const totalTime = this.results.reduce((sum, r) => sum + r.reactionTimeMs, 0)
    const avgReactionTimeMs = this.results.length > 0 ? Math.round(totalTime / this.results.length) : 0
    return {
      id: generateRecordId(),
      timestamp: Date.now(),
      difficulty: this.state.difficulty,
      totalScore: this.state.score,
      avgReactionTimeMs,
      results: [...this.results],
    }
  }

  reset(newDifficulty?: Difficulty): void {
    const difficulty = newDifficulty ?? this.state.difficulty
    this.results = []
    this.state = this.createInitialState(difficulty)
    this.notify()
  }

  getState(): GameState {
    return { ...this.state }
  }

  subscribe(fn: StateListener): () => void {
    this.listeners.add(fn)
    fn({ ...this.state })
    return () => {
      this.listeners.delete(fn)
    }
  }
}
