import { create } from 'zustand'

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  description: string
  status: TaskStatus
  createdAt: number
}

interface TaskStore {
  tasks: Task[]
  addTask: (description: string) => void
  deleteTask: (id: string) => void
  moveTask: (taskId: string, targetStatus: TaskStatus, targetIndex: number) => void
  getTasksByStatus: (status: TaskStatus) => Task[]
  getTaskCount: (status: TaskStatus) => number
}

let idCounter = 0
const generateId = (): string => {
  idCounter += 1
  return `task-${Date.now()}-${idCounter}`
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  addTask: (description: string) => {
    const trimmedDescription = description.trim().slice(0, 80)
    if (!trimmedDescription) return

    const newTask: Task = {
      id: generateId(),
      description: trimmedDescription,
      status: 'todo',
      createdAt: Date.now(),
    }

    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }))
  },

  deleteTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }))
  },

  moveTask: (taskId: string, targetStatus: TaskStatus, targetIndex: number) => {
    const { tasks } = get()
    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    if (taskIndex === -1) return

    const task = tasks[taskIndex]
    const updatedTask = { ...task, status: targetStatus }

    const tasksWithoutTask = tasks.filter((t) => t.id !== taskId)
    const targetTasks = tasksWithoutTask.filter((t) => t.status === targetStatus)
    const otherTasks = tasksWithoutTask.filter((t) => t.status !== targetStatus)

    const newTargetTasks = [...targetTasks]
    const insertIndex = Math.min(targetIndex, newTargetTasks.length)
    newTargetTasks.splice(insertIndex, 0, updatedTask)

    set({
      tasks: [...otherTasks, ...newTargetTasks],
    })
  },

  getTasksByStatus: (status: TaskStatus) => {
    return get().tasks.filter((task) => task.status === status)
  },

  getTaskCount: (status: TaskStatus) => {
    return get().tasks.filter((task) => task.status === status).length
  },
}))
