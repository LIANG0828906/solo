export interface Note {
  id: string
  columnId: string
  title: string
  content: string
  color: string
  creator: string
  createdAt: string
  order: number
}

export interface Column {
  id: string
  name: string
  defaultColor: string
}

export interface WSInitPayload {
  clientId: string
  roomId: string
  columns: Column[]
  notes: Note[]
  onlineCount: number
}

export interface WSMoveNotePayload {
  id: string
  toColumnId: string
  toIndex: number
  order: number
}
