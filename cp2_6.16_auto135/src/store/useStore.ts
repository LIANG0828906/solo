import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { set, get, keys, del } from 'idb-keyval'
import { entriesStore } from '../db'
import { Store, Entry, EntryVersion } from '../types'

const MAX_VERSIONS = 10

export const useStore = create<Store>((setState, getState) => ({
  entries: [],
  currentEntryId: null,
  activeTags: [],
  isFullscreen: false,
  saveStatus: 'idle',
  isLoading: false,

  loadEntries: async () => {
    setState({ isLoading: true })
    try {
      const allKeys = await keys(entriesStore)
      const entries: Entry[] = []
      for (const key of allKeys) {
        const entry = await get<Entry>(key, entriesStore)
        if (entry) {
          entries.push(entry)
        }
      }
      entries.sort((a, b) => b.updatedAt - a.updatedAt)
      setState({ entries, isLoading: false })
      if (entries.length > 0 && !getState().currentEntryId) {
        setState({ currentEntryId: entries[0].id })
      }
    } catch (error) {
      console.error('Failed to load entries:', error)
      setState({ isLoading: false })
    }
  },

  saveToDB: async () => {
    const state = getState()
    if (state.saveStatus === 'saving') return
    
    setState({ saveStatus: 'saving' })
    
    try {
      const currentEntry = state.entries.find(e => e.id === state.currentEntryId)
      if (currentEntry) {
        await set(currentEntry.id, currentEntry, entriesStore)
      }
      setTimeout(() => {
        setState({ saveStatus: 'saved' })
        setTimeout(() => {
          setState({ saveStatus: 'idle' })
        }, 1500)
      }, 100)
    } catch (error) {
      console.error('Failed to save:', error)
      setState({ saveStatus: 'idle' })
    }
  },

  addEntry: (entryData) => {
    const now = Date.now()
    const newEntry: Entry = {
      id: uuidv4(),
      content: entryData.content,
      tags: entryData.tags,
      createdAt: now,
      updatedAt: now,
      versions: [
        {
          id: uuidv4(),
          content: entryData.content,
          tags: entryData.tags,
          timestamp: now
        }
      ]
    }
    
    setState(state => ({
      entries: [newEntry, ...state.entries],
      currentEntryId: newEntry.id
    }))
    
    getState().saveToDB()
  },

  updateEntry: (id, updates) => {
    const state = getState()
    const entry = state.entries.find(e => e.id === id)
    if (!entry) return

    const now = Date.now()
    
    const newVersion: EntryVersion = {
      id: uuidv4(),
      content: updates.content ?? entry.content,
      tags: updates.tags ?? entry.tags,
      timestamp: now
    }
    
    const versions = [newVersion, ...entry.versions].slice(0, MAX_VERSIONS)
    
    const updatedEntry: Entry = {
      ...entry,
      ...updates,
      updatedAt: now,
      versions
    }
    
    setState(state => ({
      entries: state.entries.map(e => 
        e.id === id ? updatedEntry : e
      ).sort((a, b) => b.updatedAt - a.updatedAt)
    }))
  },

  setCurrentEntry: (id) => {
    setState({ currentEntryId: id })
  },

  toggleTag: (tag) => {
    setState(state => ({
      activeTags: state.activeTags.includes(tag)
        ? state.activeTags.filter(t => t !== tag)
        : [...state.activeTags, tag]
    }))
  },

  clearActiveTags: () => {
    setState({ activeTags: [] })
  },

  setFullscreen: (isFullscreen) => {
    setState({ isFullscreen })
  },

  setSaveStatus: (status) => {
    setState({ saveStatus: status })
  },

  createNewEntry: () => {
    const now = Date.now()
    const newEntry: Entry = {
      id: uuidv4(),
      content: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      versions: []
    }
    
    setState(state => ({
      entries: [newEntry, ...state.entries],
      currentEntryId: newEntry.id
    }))
  }
}))
