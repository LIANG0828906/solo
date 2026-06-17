export type Priority = 'high' | 'medium' | 'low'

export type ColumnId = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  columnId: ColumnId
  order: number
  creatorAvatar: string
  createdAt: number
  updatedAt: number
}

export interface Column {
  id: ColumnId
  title: string
  taskIds: string[]
}

export interface BoardState {
  tasks: Record<string, Task>
  columns: Record<ColumnId, Column>
  columnOrder: ColumnId[]
  onlineUsers: number
  lastMessageId?: string
  deletingTaskIds: Set<string>
}

export type BroadcastAction =
  | { type: 'CREATE_TASK'; payload: Task; messageId: string }
  | { type: 'UPDATE_TASK'; payload: Task; messageId: string }
  | { type: 'DELETE_TASK'; payload: { taskId: string }; messageId: string }
  | {
      type: 'MOVE_TASK'
      payload: {
        taskId: string
        fromColumn: ColumnId
        toColumn: ColumnId
        toIndex: number
      }
      messageId: string
    }
  | {
      type: 'REORDER_TASK'
      payload: { taskId: string; columnId: ColumnId; newIndex: number }
      messageId: string
    }

export interface BoardActions {
  createTask: (columnId: ColumnId, title: string) => Task | null
  updateTask: (
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority'>>
  ) => void
  deleteTask: (taskId: string) => void
  removeTaskAfterAnimation: (taskId: string) => void
  moveTask: (
    taskId: string,
    fromColumn: ColumnId,
    toColumn: ColumnId,
    toIndex: number
  ) => void
  reorderTask: (
    taskId: string,
    columnId: ColumnId,
    newIndex: number
  ) => void
  loadFromDB: () => Promise<void>
  applyRemoteAction: (action: BroadcastAction) => void
}

export type BoardStore = BoardState & BoardActions
