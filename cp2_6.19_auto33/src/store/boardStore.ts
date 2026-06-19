import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type Priority = 'high' | 'medium' | 'low'

export type ColumnId = 'todo' | 'inProgress' | 'done'

export interface SubTask {
  id: string
  title: string
  completed: boolean
  timeSpent: number
}

export interface Task {
  id: string
  title: string
  priority: Priority
  estimatedDuration: number
  column: ColumnId
  subTasks: SubTask[]
  completedPomodoros: number
  totalTimeSpent: number
  createdAt: string
  completedAt?: string
}

export interface Column {
  id: ColumnId
  title: string
  taskIds: string[]
}

interface BoardState {
  columns: Record<ColumnId, Column>
  tasks: Record<string, Task>
  expandedTaskId: string | null
  showAddModal: boolean
  flyingTaskIds: string[]
  toggleExpand: (taskId: string | null) => void
  setShowAddModal: (show: boolean) => void
  addFlyingTaskId: (id: string) => void
  removeFlyingTaskId: (id: string) => void
  addTask: (task: Omit<Task, 'id' | 'column' | 'subTasks' | 'completedPomodoros' | 'totalTimeSpent' | 'createdAt'>) => void
  moveTask: (taskId: string, sourceColumn: ColumnId, destinationColumn: ColumnId, sourceIndex: number, destinationIndex: number) => void
  reorderTask: (column: ColumnId, sourceIndex: number, destinationIndex: number) => void
  toggleSubTask: (taskId: string, subTaskId: string) => void
  addSubTask: (taskId: string, title: string) => void
  removeSubTask: (taskId: string, subTaskId: string) => void
  incrementCompletedPomodoros: (taskId: string) => void
  getTasksByColumn: (column: ColumnId) => Task[]
  getColumnById: (columnId: ColumnId) => Column
  getTaskById: (taskId: string) => Task | undefined
  getCompletedTasksByDate: (date: string) => Task[]
  getCompletedPomodorosByDate: (date: string) => number
  getTotalFocusTimeByDate: (date: string) => number
}

const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

const createInitialData = () => {
  const todoIds: string[] = []
  const inProgressIds: string[] = []
  const doneIds: string[] = []
  const tasks: Record<string, Task> = {}

  const task1Id = uuidv4()
  todoIds.push(task1Id)
  tasks[task1Id] = {
    id: task1Id,
    title: '完成项目需求文档',
    priority: 'high',
    estimatedDuration: 120,
    column: 'todo',
    subTasks: [
      { id: uuidv4(), title: '梳理功能模块', completed: true, timeSpent: 25 },
      { id: uuidv4(), title: '编写用例说明', completed: false, timeSpent: 0 },
      { id: uuidv4(), title: '绘制流程图', completed: false, timeSpent: 0 },
    ],
    completedPomodoros: 1,
    totalTimeSpent: 25,
    createdAt: getTodayString(),
  }

  const task2Id = uuidv4()
  inProgressIds.push(task2Id)
  tasks[task2Id] = {
    id: task2Id,
    title: '设计系统架构',
    priority: 'high',
    estimatedDuration: 180,
    column: 'inProgress',
    subTasks: [
      { id: uuidv4(), title: '技术选型', completed: true, timeSpent: 50 },
      { id: uuidv4(), title: '模块划分', completed: true, timeSpent: 30 },
      { id: uuidv4(), title: '接口定义', completed: false, timeSpent: 0 },
    ],
    completedPomodoros: 3,
    totalTimeSpent: 80,
    createdAt: getTodayString(),
  }

  const task3Id = uuidv4()
  doneIds.push(task3Id)
  tasks[task3Id] = {
    id: task3Id,
    title: '搭建开发环境',
    priority: 'medium',
    estimatedDuration: 60,
    column: 'done',
    subTasks: [
      { id: uuidv4(), title: '安装依赖', completed: true, timeSpent: 15 },
      { id: uuidv4(), title: '配置构建工具', completed: true, timeSpent: 25 },
      { id: uuidv4(), title: '编写示例代码', completed: true, timeSpent: 20 },
    ],
    completedPomodoros: 2,
    totalTimeSpent: 60,
    createdAt: getTodayString(),
    completedAt: getTodayString(),
  }

  const task4Id = uuidv4()
  todoIds.push(task4Id)
  tasks[task4Id] = {
    id: task4Id,
    title: '代码审查',
    priority: 'low',
    estimatedDuration: 45,
    column: 'todo',
    subTasks: [
      { id: uuidv4(), title: '检查代码规范', completed: false, timeSpent: 0 },
      { id: uuidv4(), title: '验证功能逻辑', completed: false, timeSpent: 0 },
    ],
    completedPomodoros: 0,
    totalTimeSpent: 0,
    createdAt: getTodayString(),
  }

  return {
    tasks,
    columns: {
      todo: { id: 'todo', title: '待办', taskIds: todoIds },
      inProgress: { id: 'inProgress', title: '进行中', taskIds: inProgressIds },
      done: { id: 'done', title: '已完成', taskIds: doneIds },
    },
  }
}

const initialData = createInitialData() as {
  tasks: Record<string, Task>
  columns: Record<ColumnId, Column>
}

export const useBoardStore = create<BoardState>((set, get) => ({
  columns: initialData.columns,
  tasks: initialData.tasks,
  expandedTaskId: null,
  showAddModal: false,
  flyingTaskIds: [],

  toggleExpand: (taskId) => set({ expandedTaskId: taskId }),
  setShowAddModal: (show) => set({ showAddModal: show }),
  addFlyingTaskId: (id) =>
    set((state) => ({
      flyingTaskIds: state.flyingTaskIds.includes(id)
        ? state.flyingTaskIds
        : [...state.flyingTaskIds, id],
    })),
  removeFlyingTaskId: (id) =>
    set((state) => ({
      flyingTaskIds: state.flyingTaskIds.filter((tid) => tid !== id),
    })),

  addTask: (taskData) => {
    const newTaskId = uuidv4()
    const newTask: Task = {
      ...taskData,
      id: newTaskId,
      column: 'todo',
      subTasks: [],
      completedPomodoros: 0,
      totalTimeSpent: 0,
      createdAt: getTodayString(),
    }

    set((state) => ({
      tasks: { ...state.tasks, [newTaskId]: newTask },
      columns: {
        ...state.columns,
        todo: {
          ...state.columns.todo,
          taskIds: [newTaskId, ...state.columns.todo.taskIds],
        },
      },
      flyingTaskIds: [...state.flyingTaskIds, newTaskId],
    }))

    setTimeout(() => {
      set((state) => ({
        flyingTaskIds: state.flyingTaskIds.filter((tid) => tid !== newTaskId),
      }))
    }, 600)
  },

  moveTask: (taskId, sourceColumn, destinationColumn, sourceIndex, destinationIndex) => {
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state

      const sourceTaskIds = [...state.columns[sourceColumn].taskIds]
      const destTaskIds = [...state.columns[destinationColumn].taskIds]

      const [removed] = sourceTaskIds.splice(sourceIndex, 1)
      destTaskIds.splice(destinationIndex, 0, removed)

      const updatedTask = {
        ...task,
        column: destinationColumn,
        completedAt: destinationColumn === 'done' ? getTodayString() : undefined,
      }

      return {
        tasks: { ...state.tasks, [taskId]: updatedTask },
        columns: {
          ...state.columns,
          [sourceColumn]: {
            ...state.columns[sourceColumn],
            taskIds: sourceTaskIds,
          },
          [destinationColumn]: {
            ...state.columns[destinationColumn],
            taskIds: destTaskIds,
          },
        },
      }
    })
  },

  reorderTask: (column, sourceIndex, destinationIndex) => {
    set((state) => {
      const taskIds = [...state.columns[column].taskIds]
      const [removed] = taskIds.splice(sourceIndex, 1)
      taskIds.splice(destinationIndex, 0, removed)

      return {
        columns: {
          ...state.columns,
          [column]: {
            ...state.columns[column],
            taskIds,
          },
        },
      }
    })
  },

  toggleSubTask: (taskId, subTaskId) => {
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state

      const updatedSubTasks = task.subTasks.map((st) => {
        if (st.id !== subTaskId) return st
        return {
          ...st,
          completed: !st.completed,
          timeSpent: !st.completed ? st.timeSpent + 25 : Math.max(0, st.timeSpent - 25),
        }
      })

      const totalTimeSpent = updatedSubTasks.reduce((sum, st) => sum + st.timeSpent, 0)

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            subTasks: updatedSubTasks,
            totalTimeSpent,
          },
        },
      }
    })
  },

  addSubTask: (taskId, title) => {
    set((state) => {
      const task = state.tasks[taskId]
      if (!task || task.subTasks.length >= 10) return state

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            subTasks: [
              ...task.subTasks,
              {
                id: uuidv4(),
                title,
                completed: false,
                timeSpent: 0,
              },
            ],
          },
        },
      }
    })
  },

  removeSubTask: (taskId, subTaskId) => {
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state

      const updatedSubTasks = task.subTasks.filter((st) => st.id !== subTaskId)
      const totalTimeSpent = updatedSubTasks.reduce((sum, st) => sum + st.timeSpent, 0)

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            subTasks: updatedSubTasks,
            totalTimeSpent,
          },
        },
      }
    })
  },

  incrementCompletedPomodoros: (taskId) => {
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            completedPomodoros: task.completedPomodoros + 1,
          },
        },
      }
    })
  },

  getTasksByColumn: (columnId) => {
    const state = get()
    const column = state.columns[columnId]
    return column.taskIds
      .map((taskId) => state.tasks[taskId])
      .filter(Boolean) as Task[]
  },

  getColumnById: (columnId) => {
    return get().columns[columnId]
  },

  getTaskById: (taskId) => {
    return get().tasks[taskId]
  },

  getCompletedTasksByDate: (date) => {
    return Object.values(get().tasks).filter(
      (t) => t.column === 'done' && t.completedAt === date
    )
  },

  getCompletedPomodorosByDate: (date) => {
    return get()
      .getCompletedTasksByDate(date)
      .reduce((sum, t) => sum + t.completedPomodoros, 0)
  },

  getTotalFocusTimeByDate: (date) => {
    return get()
      .getCompletedTasksByDate(date)
      .reduce((sum, t) => sum + t.totalTimeSpent, 0)
  },
}))
