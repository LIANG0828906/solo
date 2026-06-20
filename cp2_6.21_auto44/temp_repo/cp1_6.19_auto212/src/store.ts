import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  Item,
  MatchResult,
  Conversation,
  Message,
  ToastNotification
} from '@/types'
import { generateAnonymousId } from '@/utils/helpers'
import { calculateMatchScore } from '@/utils/matchingEngine'

interface StoreState {
  lostItems: Item[]
  foundItems: Item[]
  matchResults: MatchResult[]
  conversations: Conversation[]
  toasts: ToastNotification[]
  currentUserId: string
}

interface StoreActions {
  addLostItem: (data: Omit<Item, 'id' | 'createdAt' | 'status' | 'anonymousId' | 'type'>) => Item
  addFoundItem: (data: Omit<Item, 'id' | 'createdAt' | 'status' | 'anonymousId' | 'type'>) => Item
  runMatching: (newItem: Item) => MatchResult[]
  addToast: (itemName: string) => void
  removeToast: (id: string) => void
  startConversation: (matchId: string, lostId: string, foundId: string) => Conversation
  sendMessage: (conversationId: string, senderId: string, content: string) => Message | null
  markConversationRead: (conversationId: string) => void
  markItemCompleted: (itemId: string) => void
  getCurrentUserItems: () => Item[]
  getConversationsForUser: (userId: string) => Conversation[]
}

type Store = StoreState & StoreActions

const DAILY_MESSAGE_LIMIT = 10

export const useStore = create<Store>((set, get) => ({
  lostItems: [],
  foundItems: [],
  matchResults: [],
  conversations: [],
  toasts: [],
  currentUserId: generateAnonymousId('lost'),

  addLostItem: (data) => {
    const state = get()
    const newItem: Item = {
      id: uuidv4(),
      type: 'lost',
      ...data,
      createdAt: Date.now(),
      status: 'pending',
      anonymousId: state.currentUserId
    }
    set({ lostItems: [...state.lostItems, newItem] })
    return newItem
  },

  addFoundItem: (data) => {
    const state = get()
    const newItem: Item = {
      id: uuidv4(),
      type: 'found',
      ...data,
      createdAt: Date.now(),
      status: 'pending',
      anonymousId: state.currentUserId
    }
    set({ foundItems: [...state.foundItems, newItem] })
    return newItem
  },

  runMatching: (newItem) => {
    const state = get()
    const newMatches: MatchResult[] = []
    const updatedLostItems = [...state.lostItems]
    const updatedFoundItems = [...state.foundItems]

    const candidates = newItem.type === 'lost'
      ? state.foundItems.filter(i => i.status === 'pending')
      : state.lostItems.filter(i => i.status === 'pending')

    for (const candidate of candidates) {
      const { score, scoreBreakdown } = calculateMatchScore(newItem, candidate)
      if (score > 65) {
        const matchResult: MatchResult = {
          id: uuidv4(),
          lostItem: newItem.type === 'lost' ? newItem : candidate,
          foundItem: newItem.type === 'found' ? newItem : candidate,
          score,
          scoreBreakdown,
          createdAt: Date.now()
        }
        newMatches.push(matchResult)

        if (newItem.type === 'lost') {
          const lostIdx = updatedLostItems.findIndex(i => i.id === newItem.id)
          if (lostIdx !== -1) {
            updatedLostItems[lostIdx] = { ...updatedLostItems[lostIdx], status: 'matched' }
          }
          const foundIdx = updatedFoundItems.findIndex(i => i.id === candidate.id)
          if (foundIdx !== -1) {
            updatedFoundItems[foundIdx] = { ...updatedFoundItems[foundIdx], status: 'matched' }
          }
        } else {
          const foundIdx = updatedFoundItems.findIndex(i => i.id === newItem.id)
          if (foundIdx !== -1) {
            updatedFoundItems[foundIdx] = { ...updatedFoundItems[foundIdx], status: 'matched' }
          }
          const lostIdx = updatedLostItems.findIndex(i => i.id === candidate.id)
          if (lostIdx !== -1) {
            updatedLostItems[lostIdx] = { ...updatedLostItems[lostIdx], status: 'matched' }
          }
        }
      }
    }

    if (newMatches.length > 0) {
      set({
        lostItems: updatedLostItems,
        foundItems: updatedFoundItems,
        matchResults: [...state.matchResults, ...newMatches]
      })
    }

    return newMatches
  },

  addToast: (itemName) => {
    const state = get()
    const newToast: ToastNotification = {
      id: uuidv4(),
      itemName,
      timestamp: Date.now()
    }
    const updatedToasts = [...state.toasts, newToast]
    if (updatedToasts.length > 3) {
      updatedToasts.shift()
    }
    set({ toasts: updatedToasts })
  },

  removeToast: (id) => {
    const state = get()
    set({ toasts: state.toasts.filter(t => t.id !== id) })
  },

  startConversation: (matchId, lostId, foundId) => {
    const state = get()
    const conversation: Conversation = {
      id: uuidv4(),
      matchId,
      participants: [lostId, foundId],
      unreadCount: 0,
      messagesSentToday: {},
      messages: []
    }
    set({ conversations: [...state.conversations, conversation] })
    return conversation
  },

  sendMessage: (conversationId, senderId, content) => {
    const state = get()
    const convoIdx = state.conversations.findIndex(c => c.id === conversationId)
    if (convoIdx === -1) return null

    const convo = state.conversations[convoIdx]
    const today = new Date().toDateString()
    const todayKey = `${senderId}-${today}`
    const currentCount = convo.messagesSentToday[todayKey] || 0

    if (currentCount >= DAILY_MESSAGE_LIMIT) {
      return null
    }

    const message: Message = {
      id: uuidv4(),
      conversationId,
      senderId,
      content,
      timestamp: Date.now()
    }

    const updatedConvos = [...state.conversations]
    const otherParticipants = convo.participants.filter(p => p !== senderId)
    updatedConvos[convoIdx] = {
      ...convo,
      messages: [...convo.messages, message],
      lastMessage: content,
      lastMessageTime: message.timestamp,
      messagesSentToday: {
        ...convo.messagesSentToday,
        [todayKey]: currentCount + 1
      },
      unreadCount: otherParticipants.length > 0 ? convo.unreadCount + 1 : convo.unreadCount
    }

    set({ conversations: updatedConvos })
    return message
  },

  markConversationRead: (conversationId) => {
    const state = get()
    set({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    })
  },

  markItemCompleted: (itemId) => {
    const state = get()
    const match = state.matchResults.find(
      m => m.lostItem.id === itemId || m.foundItem.id === itemId
    )

    if (!match) return

    const updatedLostItems = state.lostItems.map(item =>
      item.id === match.lostItem.id || item.id === match.foundItem.id
        ? { ...item, status: 'completed' }
        : item
    )
    const updatedFoundItems = state.foundItems.map(item =>
      item.id === match.lostItem.id || item.id === match.foundItem.id
        ? { ...item, status: 'completed' }
        : item
    )

    set({
      lostItems: updatedLostItems,
      foundItems: updatedFoundItems
    })
  },

  getCurrentUserItems: () => {
    const state = get()
    return [...state.lostItems, ...state.foundItems].filter(
      item => item.anonymousId === state.currentUserId
    )
  },

  getConversationsForUser: (userId) => {
    const state = get()
    return state.conversations.filter(c => c.participants.includes(userId))
  }
}))
