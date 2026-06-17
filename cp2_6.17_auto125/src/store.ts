import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface Participant {
  id: string
  name: string
  email: string
  signedIn: boolean
  signedInAt?: string
}

export interface Event {
  id: string
  name: string
  date: string
  description: string
  participants: Participant[]
  createdAt: string
}

export interface EventStats {
  total: number
  signedIn: number
  percentage: number
}

interface EventStore {
  events: Event[]
  currentEventId: string | null
  init: () => void
  setCurrentEvent: (id: string | null) => void
  createEvent: (name: string, date: string, description: string) => Event
  deleteEvent: (eventId: string) => void
  signIn: (eventId: string, participantId: string) => void
  addParticipant: (eventId: string, name: string, email: string) => Participant | null
  addParticipantsBatch: (eventId: string, participants: Array<{ name: string; email: string }>) => Participant[]
  getEventStats: (eventId: string) => EventStats
}

const STORAGE_KEY = 'eventpulse_data'

const loadFromStorage = (): Event[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e)
  }
  return []
}

const saveToStorage = (events: Event[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  currentEventId: null,

  init: () => {
    const events = loadFromStorage()
    set({ events })
  },

  setCurrentEvent: (id) => set({ currentEventId: id }),

  createEvent: (name, date, description) => {
    const newEvent: Event = {
      id: uuidv4(),
      name,
      date,
      description,
      participants: [],
      createdAt: new Date().toISOString()
    }
    const events = [...get().events, newEvent]
    saveToStorage(events)
    set({ events })
    return newEvent
  },

  deleteEvent: (eventId) => {
    const events = get().events.filter(e => e.id !== eventId)
    saveToStorage(events)
    set({ 
      events,
      currentEventId: get().currentEventId === eventId ? null : get().currentEventId
    })
  },

  signIn: (eventId, participantId) => {
    const events = get().events.map(event => {
      if (event.id !== eventId) return event
      return {
        ...event,
        participants: event.participants.map(p => {
          if (p.id !== participantId || p.signedIn) return p
          return {
            ...p,
            signedIn: true,
            signedInAt: new Date().toISOString()
          }
        })
      }
    })
    saveToStorage(events)
    set({ events })
  },

  addParticipant: (eventId, name, email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return null
    }
    const newParticipant: Participant = {
      id: uuidv4(),
      name,
      email,
      signedIn: false
    }
    const events = get().events.map(event => {
      if (event.id !== eventId) return event
      return {
        ...event,
        participants: [...event.participants, newParticipant]
      }
    })
    saveToStorage(events)
    set({ events })
    return newParticipant
  },

  addParticipantsBatch: (eventId, participantsList) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validParticipants: Participant[] = participantsList
      .filter(p => emailRegex.test(p.email))
      .map(p => ({
        id: uuidv4(),
        name: p.name,
        email: p.email,
        signedIn: false
      }))
    
    if (validParticipants.length === 0) return []

    const events = get().events.map(event => {
      if (event.id !== eventId) return event
      return {
        ...event,
        participants: [...event.participants, ...validParticipants]
      }
    })
    saveToStorage(events)
    set({ events })
    return validParticipants
  },

  getEventStats: (eventId) => {
    const event = get().events.find(e => e.id === eventId)
    if (!event) {
      return { total: 0, signedIn: 0, percentage: 0 }
    }
    const total = event.participants.length
    let signedIn = 0
    for (let i = 0; i < total; i++) {
      if (event.participants[i].signedIn) {
        signedIn++
      }
    }
    return {
      total,
      signedIn,
      percentage: total > 0 ? (signedIn / total) * 100 : 0
    }
  }
}))
