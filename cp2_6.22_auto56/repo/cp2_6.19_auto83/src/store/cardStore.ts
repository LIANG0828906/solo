import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card } from '../utils/cardData'
import { generateInitialCardList } from '../utils/cardData'
import { synthesize, calculateSynthesisProbability } from '../utils/synthesisEngine'

interface CardStoreState {
  cardList: Card[]
  ownedCardIds: string[]
  selectedCardId: string | null
  leftSlotCardId: string | null
  rightSlotCardId: string | null
  goldSynthCount: number
  synthesisResult: { success: boolean; resultCardId: string | null } | null
  isSynthesizing: boolean
}

interface CardStoreActions {
  fetchCardList: () => void
  addCard: (cardId: string) => void
  selectCard: (cardId: string | null) => void
  setLeftSlot: (cardId: string | null) => void
  setRightSlot: (cardId: string | null) => void
  startSynthesis: () => void
  clearSynthesisResult: () => void
  clearSlots: () => void
  getOwnedCards: () => Card[]
  getSynthesisProbability: () => { canSynthesize: boolean; probability: number; resultCardName: string | null }
  isCardOwned: (cardId: string) => boolean
}

export type CardStore = CardStoreState & CardStoreActions

export const useCardStore = create<CardStore>()(
  persist(
    (set, get) => ({
      cardList: [],
      ownedCardIds: [],
      selectedCardId: null,
      leftSlotCardId: null,
      rightSlotCardId: null,
      goldSynthCount: 0,
      synthesisResult: null,
      isSynthesizing: false,

      fetchCardList: () => {
        const cardList = generateInitialCardList()
        const basicIds = ['fire', 'water', 'wind', 'earth', 'light', 'dark']
        const ownedCardIds = [...get().ownedCardIds]
        for (const id of basicIds) {
          if (!ownedCardIds.includes(id)) {
            ownedCardIds.push(id)
          }
        }
        set({ cardList, ownedCardIds })
      },

      addCard: (cardId) => {
        const { ownedCardIds } = get()
        if (!ownedCardIds.includes(cardId)) {
          set({ ownedCardIds: [...ownedCardIds, cardId] })
        }
      },

      selectCard: (cardId) => {
        set({ selectedCardId: cardId })
      },

      setLeftSlot: (cardId) => {
        set({ leftSlotCardId: cardId })
      },

      setRightSlot: (cardId) => {
        set({ rightSlotCardId: cardId })
      },

      startSynthesis: () => {
        const { leftSlotCardId, rightSlotCardId, goldSynthCount, ownedCardIds } = get()
        if (!leftSlotCardId || !rightSlotCardId) return

        set({ isSynthesizing: true })

        const result = synthesize(leftSlotCardId, rightSlotCardId, goldSynthCount)

        if (result.success && result.resultCardId) {
          const newOwnedCardIds = ownedCardIds.includes(result.resultCardId)
            ? ownedCardIds
            : [...ownedCardIds, result.resultCardId]
          set({
            goldSynthCount: result.newGoldSynthCount,
            synthesisResult: result,
            ownedCardIds: newOwnedCardIds,
          })
        } else {
          set({
            goldSynthCount: result.newGoldSynthCount,
            synthesisResult: result,
          })
        }

        setTimeout(() => {
          set({ isSynthesizing: false })
        }, 1500)
      },

      clearSynthesisResult: () => {
        set({ synthesisResult: null })
      },

      clearSlots: () => {
        set({ leftSlotCardId: null, rightSlotCardId: null })
      },

      getOwnedCards: () => {
        const { cardList, ownedCardIds } = get()
        return cardList.filter((card) => ownedCardIds.includes(card.id))
      },

      getSynthesisProbability: () => {
        const { leftSlotCardId, rightSlotCardId, goldSynthCount } = get()
        if (!leftSlotCardId || !rightSlotCardId) {
          return { canSynthesize: false, probability: 0, resultCardName: null }
        }
        return calculateSynthesisProbability(leftSlotCardId, rightSlotCardId, goldSynthCount)
      },

      isCardOwned: (cardId) => {
        return get().ownedCardIds.includes(cardId)
      },
    }),
    {
      name: 'card-fusion-store',
      partialize: (state) => ({
        cardList: state.cardList,
        ownedCardIds: state.ownedCardIds,
        goldSynthCount: state.goldSynthCount,
      }),
    }
  )
)

useCardStore.getState().fetchCardList()
