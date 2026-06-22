import { v4 as uuidv4 } from 'uuid'

export interface Card {
  id: string
  patternIndex: number
  colorIndex: number
  isFlipped: boolean
  isMatched: boolean
}

export const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
]

export const PATTERN_COUNT = 8

export class CardGenerator {
  generateCards(): Card[] {
    const cards: Card[] = []

    for (let i = 0; i < PATTERN_COUNT; i++) {
      for (let j = 0; j < 2; j++) {
        cards.push({
          id: uuidv4(),
          patternIndex: i,
          colorIndex: i,
          isFlipped: false,
          isMatched: false,
        })
      }
    }

    return this.shuffle(cards)
  }

  shuffle(cards: Card[]): Card[] {
    const shuffled = [...cards]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
