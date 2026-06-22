import { CardGenerator, Card } from './CardGenerator'
import { FeedbackModule } from './FeedbackModule'

export interface Player {
  id: number
  name: string
  score: number
}

export type GamePhase = 'idle' | 'countdown' | 'playing' | 'gameover'

export interface GameState {
  cards: Card[]
  players: Player[]
  currentPlayerIndex: number
  phase: GamePhase
  countdownValue: number
  winner: Player | null
  flippedCards: string[]
  isProcessing: boolean
}

type StateListener = (state: GameState) => void

export class GameEngine {
  private cardGenerator: CardGenerator
  private feedbackModule: FeedbackModule
  private state: GameState
  private listeners: Set<StateListener> = new Set()
  private countdownTimer: number | null = null
  private flipBackTimer: number | null = null

  constructor(cardGenerator: CardGenerator, feedbackModule: FeedbackModule) {
    this.cardGenerator = cardGenerator
    this.feedbackModule = feedbackModule
    this.state = this.createInitialState()
  }

  private createInitialState(): GameState {
    return {
      cards: [],
      players: [
        { id: 1, name: '玩家 1', score: 0 },
        { id: 2, name: '玩家 2', score: 0 },
      ],
      currentPlayerIndex: 0,
      phase: 'idle',
      countdownValue: 3,
      winner: null,
      flippedCards: [],
      isProcessing: false,
    }
  }

  getState(): GameState {
    return { ...this.state, cards: [...this.state.cards], players: [...this.state.players] }
  }

  onStateChange(callback: StateListener): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(): void {
    const stateSnapshot = this.getState()
    this.listeners.forEach((listener) => listener(stateSnapshot))
  }

  startGame(): void {
    this.clearTimers()
    this.state = {
      ...this.createInitialState(),
      cards: this.cardGenerator.generateCards(),
      phase: 'countdown',
      countdownValue: 3,
    }
    this.notifyListeners()
    this.runCountdown()
  }

  private runCountdown(): void {
    this.countdownTimer = window.setInterval(() => {
      if (this.state.countdownValue > 1) {
        this.state = { ...this.state, countdownValue: this.state.countdownValue - 1 }
        this.notifyListeners()
      } else {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer)
          this.countdownTimer = null
        }
        this.state = { ...this.state, phase: 'playing' }
        this.notifyListeners()
      }
    }, 600)
  }

  flipCard(cardId: string): void {
    if (this.state.phase !== 'playing' || this.state.isProcessing) return

    const cardIndex = this.state.cards.findIndex((c) => c.id === cardId)
    if (cardIndex === -1) return

    const card = this.state.cards[cardIndex]
    if (card.isFlipped || card.isMatched) return
    if (this.state.flippedCards.length >= 2) return

    const newCards = [...this.state.cards]
    newCards[cardIndex] = { ...card, isFlipped: true }

    const newFlippedCards = [...this.state.flippedCards, cardId]

    this.feedbackModule.playPatternSound(card.patternIndex)
    this.feedbackModule.triggerVibration(card.patternIndex)

    this.state = {
      ...this.state,
      cards: newCards,
      flippedCards: newFlippedCards,
    }
    this.notifyListeners()

    if (newFlippedCards.length === 2) {
      this.checkMatch(newFlippedCards)
    }
  }

  private checkMatch(flippedIds: string[]): void {
    this.state = { ...this.state, isProcessing: true }
    this.notifyListeners()

    const [firstId, secondId] = flippedIds
    const firstCard = this.state.cards.find((c) => c.id === firstId)
    const secondCard = this.state.cards.find((c) => c.id === secondId)

    if (!firstCard || !secondCard) {
      this.state = { ...this.state, isProcessing: false, flippedCards: [] }
      this.notifyListeners()
      return
    }

    const isMatch = firstCard.patternIndex === secondCard.patternIndex

    if (isMatch) {
      const newCards = this.state.cards.map((c) =>
        flippedIds.includes(c.id) ? { ...c, isMatched: true } : c
      )

      const newPlayers = [...this.state.players]
      newPlayers[this.state.currentPlayerIndex] = {
        ...newPlayers[this.state.currentPlayerIndex],
        score: newPlayers[this.state.currentPlayerIndex].score + 10,
      }

      this.feedbackModule.playMatchSound()

      this.state = {
        ...this.state,
        cards: newCards,
        players: newPlayers,
        flippedCards: [],
        isProcessing: false,
      }
      this.notifyListeners()

      this.checkGameOver()
    } else {
      this.flipBackTimer = window.setTimeout(() => {
        const newCards = this.state.cards.map((c) =>
          flippedIds.includes(c.id) ? { ...c, isFlipped: false } : c
        )

        const nextPlayerIndex = (this.state.currentPlayerIndex + 1) % 2

        this.state = {
          ...this.state,
          cards: newCards,
          currentPlayerIndex: nextPlayerIndex,
          flippedCards: [],
          isProcessing: false,
        }
        this.notifyListeners()
      }, 800)
    }
  }

  private checkGameOver(): void {
    const allMatched = this.state.cards.every((c) => c.isMatched)
    if (!allMatched) return

    const [p1, p2] = this.state.players
    let winner: Player | null = null
    if (p1.score > p2.score) {
      winner = p1
    } else if (p2.score > p1.score) {
      winner = p2
    }

    this.feedbackModule.playWinSound()

    this.state = {
      ...this.state,
      phase: 'gameover',
      winner,
    }
    this.notifyListeners()
  }

  resetGame(): void {
    this.startGame()
  }

  private clearTimers(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
    if (this.flipBackTimer) {
      clearTimeout(this.flipBackTimer)
      this.flipBackTimer = null
    }
  }

  destroy(): void {
    this.clearTimers()
    this.listeners.clear()
  }
}
