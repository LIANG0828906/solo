import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  Task,
  ColumnId,
  Column,
  BoardStore,
  BroadcastAction,
  Priority,
} from './types'

const DB_NAME = 'TaskPulseDB'
const DB_VERSION = 1

const DEFAULT_COLUMNS: Record<ColumnId, Column> = {
  todo: { id: 'todo', title: '待办', taskIds: [] },
  'in-progress': { id: 'in-progress', title: '进行中', taskIds: [] },
  done: { id: 'done', title: '已完成', taskIds: [] },
}

const COLUMN_ORDER: ColumnId[] = ['todo', 'in-progress', 'done']

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('columns')) {
        db.createObjectStore('columns', { keyPath: 'id' })
      }
    }
  })
}

async function saveTasks(tasks: Record<string, Task>): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction('tasks', 'readwrite')
    const store = tx.objectStore('tasks')
    store.clear()
    Object.values(tasks).forEach((task) => store.put(task))
    tx.oncomplete = () => db.close()
    tx.onerror = () => db.close()
  } catch {
    // ignore
  }
}

async function saveColumns(columns: Record<ColumnId, Column>): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction('columns', 'readwrite')
    const store = tx.objectStore('columns')
    Object.values(columns).forEach((col) => store.put(col))
    tx.oncomplete = () => db.close()
    tx.onerror = () => db.close()
  } catch {
    // ignore
  }
}

async function loadFromIndexedDB(): Promise<{
  tasks: Record<string, Task>
  columns: Record<ColumnId, Column>
} | null> {
  try {
    const db = await openDB()
    const tasksPromise = new Promise<Record<string, Task>>((resolve, reject) => {
      const tx = db.transaction('tasks', 'readonly')
      const store = tx.objectStore('tasks')
      const req = store.getAll()
      req.onsuccess = () => {
        const list = req.result as Task[]
        const map: Record<string, Task> = {}
        list.forEach((t) => (map[t.id] = t))
        resolve(map)
      }
      req.onerror = () => reject(req.error)
    })

    const columnsPromise = new Promise<Record<ColumnId, Column>>(
      (resolve, reject) => {
        const tx = db.transaction('columns', 'readonly')
        const store = tx.objectStore('columns')
        const req = store.getAll()
        req.onsuccess = () => {
          const list = req.result as Column[]
          const map: Record<ColumnId, Column> = { ...DEFAULT_COLUMNS }
          list.forEach((c) => (map[c.id] = c))
          resolve(map)
        }
        req.onerror = () => reject(req.error)
      }
    )

    const [tasks, columns] = await Promise.all([tasksPromise, columnsPromise])
    db.close()

    const hasData = Object.keys(tasks).length > 0 ||
      Object.values(columns).some((c) => c.taskIds.length > 0)

    return hasData ? { tasks, columns } : null
  } catch {
    return null
  }
}

function generateSoftColor(): string {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 60%, 65%)`
}

function getRandomPriority(): Priority {
  const r = Math.random()
  if (r < 0.33) return 'high'
  if (r < 0.66) return 'medium'
  return 'low'
}

function createDemoData(): {
  tasks: Record<string, Task>
  columns: Record<ColumnId, Column>
} {
  const now = Date.now()
  const demoTasks: Task[] = [
    {
      id: uuidv4(),
      title: '设计首页UI原型',
      description: '完成TaskPulse看板的整体视觉设计，包括列样式、卡片样式、动效规范',
      priority: 'high',
      columnId: 'todo',
      order: 0,
      creatorAvatar: generateSoftColor(),
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: uuidv4(),
      title: '搭建Vite项目框架',
      description: '初始化Vite + React + TypeScript，配置严格模式和路径别名',
      priority: 'medium',
      columnId: 'in-progress',
      order: 0,
      creatorAvatar: generateSoftColor(),
      createdAt: now - 3600000,
      updatedAt: now - 1800000,
    },
    {
      id: uuidv4(),
      title: '实现Zustand状态管理',
      description: '包含任务CRUD、拖拽移动逻辑、与IndexedDB集成',
      priority: 'low',
      columnId: 'done',
      order: 0,
      creatorAvatar: generateSoftColor(),
      createdAt: now - 172800000,
      updatedAt: now - 7200000,
    },
  ]
  const tasks: Record<string, Task> = {}
  const columns: Record<ColumnId, Column> = JSON.parse(JSON.stringify(DEFAULT_COLUMNS))
  demoTasks.forEach((t) => {
    tasks[t.id] = t
    columns[t.columnId].taskIds.push(t.id)
  })
  return { tasks, columns }
}

function persistState(state: {
  tasks: Record<string, Task>
  columns: Record<ColumnId, Column>
}) {
  queueMicrotask(() => {
    saveTasks(state.tasks)
    saveColumns(state.columns)
  })
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  tasks: {},
  columns: JSON.parse(JSON.stringify(DEFAULT_COLUMNS)),
  columnOrder: COLUMN_ORDER,
  onlineUsers: 1,
  deletingTaskIds: new Set<string>(),

  createTask: (columnId, title) => {
    if (!title.trim()) return null
    const now = Date.now()
    const newTask: Task = {
      id: uuidv4(),
      title: title.trim(),
      description: '',
      priority: getRandomPriority(),
      columnId,
      order: 0,
      creatorAvatar: generateSoftColor(),
      createdAt: now,
      updatedAt: now,
    }
    set((state) => {
      const newColumns = { ...state.columns }
      const col = { ...newColumns[columnId] }
      col.taskIds = [...col.taskIds, newTask.id]
      newColumns[columnId] = col
      const newTasks = { ...state.tasks, [newTask.id]: newTask }
      persistState({ tasks: newTasks, columns: newColumns })
      const messageId = uuidv4()
      const action: BroadcastAction = {
        type: 'CREATE_TASK',
        payload: newTask,
        messageId,
      }
      window.__taskpulse_channel__?.postMessage(action)
      return {
        tasks: newTasks,
        columns: newColumns,
        lastMessageId: messageId,
      }
    })
    return newTask
  },

  updateTask: (taskId, updates) => {
    set((state) => {
      const old = state.tasks[taskId]
      if (!old) return state
      const updated: Task = {
        ...old,
        ...updates,
        updatedAt: Date.now(),
      }
      const newTasks = { ...state.tasks, [taskId]: updated }
      persistState({ tasks: newTasks, columns: state.columns })
      const messageId = uuidv4()
      const action: BroadcastAction = {
        type: 'UPDATE_TASK',
        payload: updated,
        messageId,
      }
      window.__taskpulse_channel__?.postMessage(action)
      return { tasks: newTasks, lastMessageId: messageId }
    })
  },

  deleteTask: (taskId) => {
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state
      const newDeleting = new Set(state.deletingTaskIds)
      newDeleting.add(taskId)
      const messageId = uuidv4()
      const action: BroadcastAction = {
        type: 'DELETE_TASK',
        payload: { taskId },
        messageId,
      }
      window.__taskpulse_channel__?.postMessage(action)
      return {
        deletingTaskIds: newDeleting,
        lastMessageId: messageId,
      }
    })
  },

  removeTaskAfterAnimation: (taskId) => {
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state
      const newTasks = { ...state.tasks }
      delete newTasks[taskId]
      const newColumns = { ...state.columns }
      const col = { ...newColumns[task.columnId] }
      col.taskIds = col.taskIds.filter((id) => id !== taskId)
      newColumns[task.columnId] = col
      const newDeleting = new Set(state.deletingTaskIds)
      newDeleting.delete(taskId)
      persistState({ tasks: newTasks, columns: newColumns })
      return {
        tasks: newTasks,
        columns: newColumns,
        deletingTaskIds: newDeleting,
      }
    })
  },

  moveTask: (taskId, fromColumn, toColumn, toIndex) => {
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state
      const newColumns = { ...state.columns }
      const fromCol = { ...newColumns[fromColumn] }
      fromCol.taskIds = fromCol.taskIds.filter((id) => id !== taskId)
      newColumns[fromColumn] = fromCol
      const toCol = { ...newColumns[toColumn] }
      const newToIds = [...toCol.taskIds]
      const safeIndex = Math.max(0, Math.min(toIndex, newToIds.length))
      newToIds.splice(safeIndex, 0, taskId)
      toCol.taskIds = newToIds
      newColumns[toColumn] = toCol
      const updatedTask: Task = {
        ...task,
        columnId: toColumn,
        order: safeIndex,
        updatedAt: Date.now(),
      }
      const newTasks = { ...state.tasks, [taskId]: updatedTask }
      persistState({ tasks: newTasks, columns: newColumns })
      const messageId = uuidv4()
      const action: BroadcastAction = {
        type: 'MOVE_TASK',
        payload: { taskId, fromColumn, toColumn, toIndex: safeIndex },
        messageId,
      }
      window.__taskpulse_channel__?.postMessage(action)
      return {
        tasks: newTasks,
        columns: newColumns,
        lastMessageId: messageId,
      }
    })
  },

  reorderTask: (taskId, columnId, newIndex) => {
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state
      const newColumns = { ...state.columns }
      const col = { ...newColumns[columnId] }
      const ids = [...col.taskIds]
      const currentIdx = ids.indexOf(taskId)
      if (currentIdx === -1) return state
      ids.splice(currentIdx, 1)
      const safeIndex = Math.max(0, Math.min(newIndex, ids.length))
      ids.splice(safeIndex, 0, taskId)
      col.taskIds = ids
      newColumns[columnId] = col
      const updatedTask: Task = {
        ...task,
        order: safeIndex,
        updatedAt: Date.now(),
      }
      const newTasks = { ...state.tasks, [taskId]: updatedTask }
      persistState({ tasks: newTasks, columns: newColumns })
      const messageId = uuidv4()
      const action: BroadcastAction = {
        type: 'REORDER_TASK',
        payload: { taskId, columnId, newIndex: safeIndex },
        messageId,
      }
      window.__taskpulse_channel__?.postMessage(action)
      return {
        tasks: newTasks,
        columns: newColumns,
        lastMessageId: messageId,
      }
    })
  },

  loadFromDB: async () => {
    const data = await loadFromIndexedDB()
    if (data) {
      set({ tasks: data.tasks, columns: data.columns })
    } else {
      const demo = createDemoData()
      set({ tasks: demo.tasks, columns: demo.columns })
      persistState(demo)
    }
  },

  applyRemoteAction: (action) => {
    set((state) => {
      if (action.messageId && action.messageId === state.lastMessageId) {
        return state
      }
      switch (action.type) {
        case 'CREATE_TASK': {
          const task = action.payload
          if (state.tasks[task.id]) return state
          const newTasks = { ...state.tasks, [task.id]: task }
          const newColumns = { ...state.columns }
          const col = { ...newColumns[task.columnId] }
          col.taskIds = [...col.taskIds, task.id]
          newColumns[task.columnId] = col
          persistState({ tasks: newTasks, columns: newColumns })
          return {
            tasks: newTasks,
            columns: newColumns,
            lastMessageId: action.messageId,
          }
        }
        case 'UPDATE_TASK': {
          const task = action.payload
          if (!state.tasks[task.id]) return state
          const newTasks = { ...state.tasks, [task.id]: task }
          persistState({ tasks: newTasks, columns: state.columns })
          return { tasks: newTasks, lastMessageId: action.messageId }
        }
        case 'DELETE_TASK': {
          const { taskId } = action.payload
          const task = state.tasks[taskId]
          if (!task) return state
          const newTasks = { ...state.tasks }
          delete newTasks[taskId]
          const newColumns = { ...state.columns }
          const col = { ...newColumns[task.columnId] }
          col.taskIds = col.taskIds.filter((id) => id !== taskId)
          newColumns[task.columnId] = col
          persistState({ tasks: newTasks, columns: newColumns })
          return {
            tasks: newTasks,
            columns: newColumns,
            lastMessageId: action.messageId,
          }
        }
        case 'MOVE_TASK': {
          const { taskId, fromColumn, toColumn, toIndex } = action.payload
          const task = state.tasks[taskId]
          if (!task) return state
          const newColumns = { ...state.columns }
          const fromCol = { ...newColumns[fromColumn] }
          fromCol.taskIds = fromCol.taskIds.filter((id) => id !== taskId)
          newColumns[fromColumn] = fromCol
          const toCol = { ...newColumns[toColumn] }
          const newToIds = [...toCol.taskIds]
          const safeIndex = Math.max(0, Math.min(toIndex, newToIds.length))
          newToIds.splice(safeIndex, 0, taskId)
          toCol.taskIds = newToIds
          newColumns[toColumn] = toCol
          const updatedTask: Task = {
            ...task,
            columnId: toColumn,
            order: safeIndex,
          }
          const newTasks = { ...state.tasks, [taskId]: updatedTask }
          persistState({ tasks: newTasks, columns: newColumns })
          return {
            tasks: newTasks,
            columns: newColumns,
            lastMessageId: action.messageId,
          }
        }
        case 'REORDER_TASK': {
          const { taskId, columnId, newIndex } = action.payload
          const task = state.tasks[taskId]
          if (!task) return state
          const newColumns = { ...state.columns }
          const col = { ...newColumns[columnId] }
          const ids = [...col.taskIds]
          const currentIdx = ids.indexOf(taskId)
          if (currentIdx === -1) return state
          ids.splice(currentIdx, 1)
          const safeIndex = Math.max(0, Math.min(newIndex, ids.length))
          ids.splice(safeIndex, 0, taskId)
          col.taskIds = ids
          newColumns[columnId] = col
          const updatedTask: Task = { ...task, order: safeIndex }
          const newTasks = { ...state.tasks, [taskId]: updatedTask }
          persistState({ tasks: newTasks, columns: newColumns })
          return {
            tasks: newTasks,
            columns: newColumns,
            lastMessageId: action.messageId,
          }
        }
        default:
          return state
      }
    })
  },
}))
