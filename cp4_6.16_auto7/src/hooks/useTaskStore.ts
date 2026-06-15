import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  name: string
  status: TaskStatus
  dueDate: string
  x: number
  y: number
  hasCycle?: boolean
}

export interface Dependency {
  id: string
  source: string
  target: string
}

interface TaskStore {
  tasks: Task[]
  dependencies: Dependency[]
  highlightedTaskId: string | null
  searchQuery: string
  statusFilter: 'all' | TaskStatus
  addTask: (task: Omit<Task, 'id' | 'x' | 'y'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addDependency: (source: string, target: string) => void
  removeDependency: (id: string) => void
  topologicalSort: () => Task[]
  detectCycles: () => string[]
  getDownstreamTasks: (taskId: string) => string[]
  getUpstreamTasks: (taskId: string) => string[]
  setHighlightedTask: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setStatusFilter: (filter: 'all' | TaskStatus) => void
  resetAll: () => void
  loadFromStorage: () => void
}

const STORAGE_KEY = 'task-dependency-board-data'

const getInitialData = () => {
  const sampleTasks: Task[] = [
    { id: uuidv4(), name: '需求分析', status: 'done', dueDate: '2026-06-20', x: 200, y: 200 },
    { id: uuidv4(), name: '系统设计', status: 'in-progress', dueDate: '2026-06-25', x: 400, y: 150 },
    { id: uuidv4(), name: '数据库设计', status: 'todo', dueDate: '2026-06-28', x: 350, y: 300 },
    { id: uuidv4(), name: '前端开发', status: 'todo', dueDate: '2026-07-05', x: 600, y: 200 },
    { id: uuidv4(), name: '后端开发', status: 'todo', dueDate: '2026-07-10', x: 550, y: 350 },
    { id: uuidv4(), name: '测试部署', status: 'todo', dueDate: '2026-07-15', x: 750, y: 280 },
  ]

  const sampleDependencies: Dependency[] = [
    { id: uuidv4(), source: sampleTasks[0].id, target: sampleTasks[1].id },
    { id: uuidv4(), source: sampleTasks[1].id, target: sampleTasks[2].id },
    { id: uuidv4(), source: sampleTasks[2].id, target: sampleTasks[3].id },
    { id: uuidv4(), source: sampleTasks[2].id, target: sampleTasks[4].id },
    { id: uuidv4(), source: sampleTasks[3].id, target: sampleTasks[5].id },
    { id: uuidv4(), source: sampleTasks[4].id, target: sampleTasks[5].id },
  ]

  return { tasks: sampleTasks, dependencies: sampleDependencies }
}

const saveToStorage = (tasks: Task[], dependencies: Dependency[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, dependencies }))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  dependencies: [],
  highlightedTaskId: null,
  searchQuery: '',
  statusFilter: 'all',

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150,
    }
    set((state) => {
      const newTasks = [...state.tasks, newTask]
      saveToStorage(newTasks, state.dependencies)
      return { tasks: newTasks }
    })
  },

  updateTask: (id, updates) => {
    set((state) => {
      const newTasks = state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      )
      saveToStorage(newTasks, state.dependencies)
      return { tasks: newTasks }
    })
  },

  deleteTask: (id) => {
    set((state) => {
      const newTasks = state.tasks.filter((t) => t.id !== id)
      const newDependencies = state.dependencies.filter(
        (d) => d.source !== id && d.target !== id
      )
      saveToStorage(newTasks, newDependencies)
      return { tasks: newTasks, dependencies: newDependencies }
    })
  },

  addDependency: (source, target) => {
    if (source === target) return

    set((state) => {
      const exists = state.dependencies.some(
        (d) => d.source === source && d.target === target
      )
      if (exists) return state

      const newDependency: Dependency = {
        id: uuidv4(),
        source,
        target,
      }
      const newDependencies = [...state.dependencies, newDependency]
      saveToStorage(state.tasks, newDependencies)
      return { dependencies: newDependencies }
    })
  },

  removeDependency: (id) => {
    set((state) => {
      const newDependencies = state.dependencies.filter((d) => d.id !== id)
      saveToStorage(state.tasks, newDependencies)
      return { dependencies: newDependencies }
    })
  },

  topologicalSort: () => {
    const { tasks, dependencies } = get()
    const inDegree = new Map<string, number>()
    const adjacency = new Map<string, string[]>()

    tasks.forEach((t) => {
      inDegree.set(t.id, 0)
      adjacency.set(t.id, [])
    })

    dependencies.forEach((d) => {
      const current = inDegree.get(d.target) || 0
      inDegree.set(d.target, current + 1)
      adjacency.get(d.source)?.push(d.target)
    })

    const queue: string[] = []
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id)
    })

    const result: Task[] = []
    const taskMap = new Map(tasks.map((t) => [t.id, t]))
    const visited = new Set<string>()

    while (queue.length > 0) {
      const id = queue.shift()!
      visited.add(id)
      const task = taskMap.get(id)
      if (task) result.push(task)

      adjacency.get(id)?.forEach((neighbor) => {
        const current = inDegree.get(neighbor)! - 1
        inDegree.set(neighbor, current)
        if (current === 0) queue.push(neighbor)
      })
    }

    const cycleIds = new Set<string>()
    tasks.forEach((t) => {
      if (!visited.has(t.id)) {
        cycleIds.add(t.id)
      }
    })

    tasks.forEach((t) => {
      t.hasCycle = cycleIds.has(t.id)
    })

    const remaining = tasks.filter((t) => cycleIds.has(t.id))
    return [...result, ...remaining]
  },

  detectCycles: () => {
    const { tasks, dependencies } = get()
    const adjacency = new Map<string, string[]>()

    tasks.forEach((t) => adjacency.set(t.id, []))
    dependencies.forEach((d) => adjacency.get(d.source)?.push(d.target))

    const UNVISITED = 0
    const VISITING = 1
    const VISITED = 2
    const status = new Map<string, number>()
    const cycleNodes = new Set<string>()

    tasks.forEach((t) => status.set(t.id, UNVISITED))

    const dfs = (nodeId: string, path: Set<string>): boolean => {
      status.set(nodeId, VISITING)
      path.add(nodeId)

      for (const neighbor of adjacency.get(nodeId) || []) {
        if (status.get(neighbor) === VISITING) {
          path.forEach((n) => cycleNodes.add(n))
          return true
        }
        if (status.get(neighbor) === UNVISITED && dfs(neighbor, path)) {
          return true
        }
      }

      status.set(nodeId, VISITED)
      path.delete(nodeId)
      return false
    }

    tasks.forEach((t) => {
      if (status.get(t.id) === UNVISITED) {
        dfs(t.id, new Set())
      }
    })

    return Array.from(cycleNodes)
  },

  getDownstreamTasks: (taskId) => {
    const { dependencies } = get()
    const result = new Set<string>()
    const queue = [taskId]

    while (queue.length > 0) {
      const current = queue.shift()!
      dependencies
        .filter((d) => d.source === current)
        .forEach((d) => {
          if (!result.has(d.target)) {
            result.add(d.target)
            queue.push(d.target)
          }
        })
    }

    return Array.from(result)
  },

  getUpstreamTasks: (taskId) => {
    const { dependencies } = get()
    const result = new Set<string>()
    const queue = [taskId]

    while (queue.length > 0) {
      const current = queue.shift()!
      dependencies
        .filter((d) => d.target === current)
        .forEach((d) => {
          if (!result.has(d.source)) {
            result.add(d.source)
            queue.push(d.source)
          }
        })
    }

    return Array.from(result)
  },

  setHighlightedTask: (id) => set({ highlightedTaskId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    const initial = getInitialData()
    set({
      tasks: initial.tasks,
      dependencies: initial.dependencies,
      highlightedTaskId: null,
      searchQuery: '',
      statusFilter: 'all',
    })
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        set({
          tasks: data.tasks || [],
          dependencies: data.dependencies || [],
        })
      } else {
        const initial = getInitialData()
        set({
          tasks: initial.tasks,
          dependencies: initial.dependencies,
        })
        saveToStorage(initial.tasks, initial.dependencies)
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e)
      const initial = getInitialData()
      set({
        tasks: initial.tasks,
        dependencies: initial.dependencies,
      })
    }
  },
}))
