import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sm2, isCardDueForReview, SM2Output } from '@/utils/spacedRepetition'

export interface Card {
  id: string
  front: string
  back: string
  easinessFactor: number
  interval: number
  repetitions: number
  nextReviewDate: string
}

export interface Deck {
  id: string
  name: string
  description: string
  cards: Card[]
  createdAt: string
}

export interface ReviewRecord {
  date: string
  total: number
  correct: number
}

export interface DeckState {
  decks: Deck[]
  selectedDeckId: string | null
  reviewQueue: Card[]
  currentCardIndex: number
  reviewRecords: ReviewRecord[]
  isFlipped: boolean

  createDeck: (name: string, description: string) => void
  deleteDeck: (deckId: string) => void
  selectDeck: (deckId: string | null) => void
  addCard: (deckId: string, front: string, back: string) => void
  deleteCard: (deckId: string, cardId: string) => void

  startReview: (deckId: string) => void
  nextCard: () => void
  toggleFlip: () => void
  rateCard: (quality: number) => void

  getDueCards: (deckId: string) => Card[]
  getDeckDueCount: (deckId: string) => number
}

const generateId = () => Math.random().toString(36).slice(2, 11)

const todayStr = () => new Date().toISOString().split('T')[0]

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => ({
      decks: [],
      selectedDeckId: null,
      reviewQueue: [],
      currentCardIndex: 0,
      reviewRecords: [],
      isFlipped: false,

      createDeck: (name, description) => {
        const newDeck: Deck = {
          id: generateId(),
          name,
          description,
          cards: [],
          createdAt: new Date().toISOString()
        }
        set((state) => ({ decks: [...state.decks, newDeck] }))
      },

      deleteDeck: (deckId) => {
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== deckId),
          selectedDeckId:
            state.selectedDeckId === deckId ? null : state.selectedDeckId
        }))
      },

      selectDeck: (deckId) => {
        set({ selectedDeckId: deckId })
      },

      addCard: (deckId, front, back) => {
        const today = todayStr()
        const newCard: Card = {
          id: generateId(),
          front,
          back,
          easinessFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewDate: today
        }
        set((state) => ({
          decks: state.decks.map((deck) =>
            deck.id === deckId
              ? { ...deck, cards: [...deck.cards, newCard] }
              : deck
          )
        }))
      },

      deleteCard: (deckId, cardId) => {
        set((state) => ({
          decks: state.decks.map((deck) =>
            deck.id === deckId
              ? { ...deck, cards: deck.cards.filter((c) => c.id !== cardId) }
              : deck
          )
        }))
      },

      startReview: (deckId) => {
        const dueCards = get().getDueCards(deckId)
        set({
          selectedDeckId: deckId,
          reviewQueue: dueCards,
          currentCardIndex: 0,
          isFlipped: false
        })
      },

      nextCard: () => {
        set((state) => ({
          currentCardIndex: state.currentCardIndex + 1,
          isFlipped: false
        }))
      },

      toggleFlip: () => {
        set((state) => ({ isFlipped: !state.isFlipped }))
      },

      rateCard: (quality) => {
        const state = get()
        const currentCard = state.reviewQueue[state.currentCardIndex]
        if (!currentCard || !state.selectedDeckId) return

        const result: SM2Output = sm2({
          quality,
          easinessFactor: currentCard.easinessFactor,
          interval: currentCard.interval,
          repetitions: currentCard.repetitions
        })

        const updatedCard: Card = {
          ...currentCard,
          easinessFactor: result.easinessFactor,
          interval: result.interval,
          repetitions: result.repetitions,
          nextReviewDate: result.nextReviewDate
        }

        const today = todayStr()
        const isCorrect = quality >= 3

        set((s) => {
          const existingRecord = s.reviewRecords.find((r) => r.date === today)
          let newRecords
          if (existingRecord) {
            newRecords = s.reviewRecords.map((r) =>
              r.date === today
                ? {
                    ...r,
                    total: r.total + 1,
                    correct: r.correct + (isCorrect ? 1 : 0)
                  }
                : r
            )
          } else {
            newRecords = [
              ...s.reviewRecords,
              { date: today, total: 1, correct: isCorrect ? 1 : 0 }
            ]
          }

          return {
            decks: s.decks.map((deck) =>
              deck.id === s.selectedDeckId
                ? {
                    ...deck,
                    cards: deck.cards.map((c) =>
                      c.id === currentCard.id ? updatedCard : c
                    )
                  }
                : deck
            ),
            reviewQueue: s.reviewQueue.map((c) =>
              c.id === currentCard.id ? updatedCard : c
            ),
            currentCardIndex: s.currentCardIndex + 1,
            isFlipped: false,
            reviewRecords: newRecords
          }
        })
      },

      getDueCards: (deckId) => {
        const deck = get().decks.find((d) => d.id === deckId)
        if (!deck) return []
        return deck.cards.filter((card) => isCardDueForReview(card.nextReviewDate))
      },

      getDeckDueCount: (deckId) => {
        return get().getDueCards(deckId).length
      }
    }),
    {
      name: 'flashcard-deck-storage'
    }
  )
)
