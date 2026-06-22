export interface Entry {
  id: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
  versions: EntryVersion[]
}

export interface EntryVersion {
  id: string
  content: string
  tags: string[]
  timestamp: number
}

export interface AppState {
  entries: Entry[]
  currentEntryId: string | null
  activeTags: string[]
  isFullscreen: boolean
  saveStatus: 'idle' | 'saving' | 'saved'
  isLoading: boolean
}

export interface AppActions {
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) => void
  updateEntry: (id: string, updates: Partial<Entry>) => void
  setCurrentEntry: (id: string | null) => void
  toggleTag: (tag: string) => void
  clearActiveTags: () => void
  setFullscreen: (isFullscreen: boolean) => void
  setSaveStatus: (status: 'idle' | 'saving' | 'saved') => void
  loadEntries: () => Promise<void>
  saveToDB: () => Promise<void>
  createNewEntry: () => void
}

export type Store = AppState & AppActions
