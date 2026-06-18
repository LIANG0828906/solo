import {
  CardConfig,
  generateDeck,
  shuffleDeck,
  Unit,
  createUnitFromCard,
  SkillEffect
} from '../data/GameData'

export type CardEffectType = 'summon' | 'attack' | 'skill'

export interface CardEffect {
  type: CardEffectType
  cardId: string
  sourceUnitId?: string
  targetUnitId?: string
  position?: number
  skill?: SkillEffect
}

export class CardSystem {
  private playerDeck: CardConfig[] = []
  private playerHand: CardConfig[] = []
  private playerDiscard: CardConfig[] = []

  private aiDeck: CardConfig[] = []
  private aiHand: CardConfig[] = []
  private aiDiscard: CardConfig[] = []

  private readonly maxHandSize = 5
  private readonly maxFieldUnits = 3

  constructor() {
    this.initializeDecks()
  }

  private initializeDecks(): void {
    this.playerDeck = shuffleDeck(generateDeck('player'))
    this.playerHand = []
    this.playerDiscard = []

    this.aiDeck = shuffleDeck(generateDeck('ai'))
    this.aiHand = []
    this.aiDiscard = []
  }

  drawPlayerCard(): CardConfig | null {
    return this.drawCard('player')
  }

  drawAiCard(): CardConfig | null {
    return this.drawCard('ai')
  }

  private drawCard(side: 'player' | 'ai'): CardConfig | null {
    const deck = side === 'player' ? this.playerDeck : this.aiDeck
    const hand = side === 'player' ? this.playerHand : this.aiHand
    const discard = side === 'player' ? this.playerDiscard : this.aiDiscard

    if (hand.length >= this.maxHandSize) {
      return null
    }

    if (deck.length === 0) {
      if (discard.length === 0) return null
      const newDeck = shuffleDeck(discard)
      if (side === 'player') {
        this.playerDeck = newDeck
        this.playerDiscard = []
      } else {
        this.aiDeck = newDeck
        this.aiDiscard = []
      }
    }

    const targetDeck = side === 'player' ? this.playerDeck : this.aiDeck
    const card = targetDeck.pop()
    if (card) {
      hand.push(card)
    }
    return card || null
  }

  getPlayerHand(): CardConfig[] {
    return [...this.playerHand]
  }

  getAiHand(): CardConfig[] {
    return [...this.aiHand]
  }

  getPlayerDeckCount(): number {
    return this.playerDeck.length
  }

  getAiDeckCount(): number {
    return this.aiDeck.length
  }

  getMaxHandSize(): number {
    return this.maxHandSize
  }

  getMaxFieldUnits(): number {
    return this.maxFieldUnits
  }

  playCard(cardId: string, side: 'player' | 'ai', fieldUnits: Unit[], targetPosition?: number): CardEffect | null {
    const hand = side === 'player' ? this.playerHand : this.aiHand
    const cardIndex = hand.findIndex(c => c.id === cardId)

    if (cardIndex === -1) return null
    if (fieldUnits.length >= this.maxFieldUnits && targetPosition === undefined) return null

    const card = hand[cardIndex]
    hand.splice(cardIndex, 1)

    const discard = side === 'player' ? this.playerDiscard : this.aiDiscard
    discard.push(card)

    const position = targetPosition ?? fieldUnits.length

    return {
      type: 'summon',
      cardId: card.id,
      position,
      skill: card.skill
    }
  }

  useSkill(sourceUnit: Unit, targetUnit: Unit): CardEffect | null {
    if (sourceUnit.skillCooldown > 0) return null

    return {
      type: 'skill',
      cardId: sourceUnit.id,
      sourceUnitId: sourceUnit.id,
      targetUnitId: targetUnit.id,
      skill: sourceUnit.skill
    }
  }

  attack(sourceUnit: Unit, targetUnit: Unit): CardEffect {
    return {
      type: 'attack',
      cardId: sourceUnit.id,
      sourceUnitId: sourceUnit.id,
      targetUnitId: targetUnit.id
    }
  }

  createUnitFromCard(cardId: string, side: 'player' | 'ai'): Unit | null {
    const hand = side === 'player' ? this.playerHand : this.aiHand
    const card = hand.find(c => c.id === cardId)
    if (!card) return null
    return createUnitFromCard(card)
  }

  getCardById(cardId: string, side: 'player' | 'ai'): CardConfig | undefined {
    const hand = side === 'player' ? this.playerHand : this.aiHand
    return hand.find(c => c.id === cardId)
  }

  reset(): void {
    this.initializeDecks()
  }
}
