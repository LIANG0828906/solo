export type Priority = 'high' | 'medium' | 'low'

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Card {
  id: string
  title: string
  description: string
  priority: Priority
  assignee: string
  dueDate: string
  tags: Tag[]
  columnId: string
  order: number
}

export interface Column {
  id: string
  title: string
  order: number
}

export interface BoardState {
  columns: Column[]
  cards: Card[]
  searchQuery: string
  statsPanelOpen: boolean
  editingCardId: string | null
  confirmDeleteColumnId: string | null
}

export interface BoardStore extends BoardState {
  initFromDB: () => Promise<void>
  saveToDB: () => Promise<void>
  addColumn: (title: string) => void
  updateColumnTitle: (id: string, title: string) => void
  deleteColumn: (id: string) => void
  addCard: (columnId: string, card: Omit<Card, 'id' | 'columnId' | 'order'>) => void
  updateCard: (id: string, updates: Partial<Card>) => void
  deleteCard: (id: string) => void
  moveCard: (
    sourceColumnId: string,
    destinationColumnId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => void
  setSearchQuery: (query: string) => void
  toggleStatsPanel: () => void
  setEditingCardId: (id: string | null) => void
  setConfirmDeleteColumnId: (id: string | null) => void
}
