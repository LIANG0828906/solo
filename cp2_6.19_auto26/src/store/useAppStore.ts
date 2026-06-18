import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  assignee: string
  priority: Priority
  status: TaskStatus
  estimatedHours: number
  completedHours: number
  sprintId: string | null
  createdAt: string
  completedAt: string | null
}

export interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  teamMembers: string[]
  taskIds: string[]
}

export interface TeamMember {
  id: string
  name: string
}

interface AppState {
  tasks: Task[]
  sprints: Sprint[]
  teamMembers: TeamMember[]
  currentSprintId: string | null
  editingTaskId: string | null
  isCreateSprintOpen: boolean
  sidebarOpen: boolean

  setTasks: (tasks: Task[]) => void
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  setSprints: (sprints: Sprint[]) => void
  addSprint: (sprint: Omit<Sprint, 'id' | 'taskIds'>) => void
  updateSprint: (id: string, updates: Partial<Sprint>) => void
  deleteSprint: (id: string) => void
  addTaskToSprint: (sprintId: string, taskId: string) => void
  removeTaskFromSprint: (sprintId: string, taskId: string) => void
  setCurrentSprintId: (id: string | null) => void
  setEditingTaskId: (id: string | null) => void
  setCreateSprintOpen: (open: boolean) => void
  setSidebarOpen: (open: boolean) => void
}

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm-1', name: '张伟' },
  { id: 'tm-2', name: '李娜' },
  { id: 'tm-3', name: '王强' },
  { id: 'tm-4', name: '赵敏' },
  { id: 'tm-5', name: '陈晨' },
]

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-1', title: '用户认证模块开发', description: '实现JWT认证和OAuth2.0集成，包含登录、注册和密码重置功能', assignee: 'tm-1',
    priority: 'high', status: 'in-progress', estimatedHours: 16, completedHours: 8, sprintId: null, createdAt: '2026-06-10', completedAt: null,
  },
  {
    id: 'task-2', title: '数据库Schema设计', description: '设计并实现PostgreSQL数据库表结构，包含用户、项目、任务等核心表', assignee: 'tm-2',
    priority: 'high', status: 'done', estimatedHours: 12, completedHours: 12, sprintId: null, createdAt: '2026-06-09', completedAt: '2026-06-15',
  },
  {
    id: 'task-3', title: 'API接口文档编写', description: '使用OpenAPI 3.0规范编写REST API文档，覆盖所有CRUD接口', assignee: 'tm-3',
    priority: 'medium', status: 'todo', estimatedHours: 8, completedHours: 0, sprintId: null, createdAt: '2026-06-11', completedAt: null,
  },
  {
    id: 'task-4', title: '前端组件库搭建', description: '基于React构建可复用组件库，包含按钮、表单、表格、模态框等基础组件', assignee: 'tm-4',
    priority: 'medium', status: 'in-progress', estimatedHours: 20, completedHours: 10, sprintId: null, createdAt: '2026-06-10', completedAt: null,
  },
  {
    id: 'task-5', title: '单元测试覆盖率提升', description: '将核心业务逻辑的单元测试覆盖率提升至80%以上', assignee: 'tm-5',
    priority: 'low', status: 'todo', estimatedHours: 10, completedHours: 0, sprintId: null, createdAt: '2026-06-12', completedAt: null,
  },
  {
    id: 'task-6', title: '性能监控仪表盘', description: '集成Sentry和自定义指标，构建实时性能监控仪表盘', assignee: 'tm-1',
    priority: 'medium', status: 'todo', estimatedHours: 14, completedHours: 0, sprintId: null, createdAt: '2026-06-13', completedAt: null,
  },
  {
    id: 'task-7', title: 'CI/CD流水线配置', description: '配置GitHub Actions自动化构建、测试和部署流程', assignee: 'tm-3',
    priority: 'high', status: 'todo', estimatedHours: 6, completedHours: 0, sprintId: null, createdAt: '2026-06-14', completedAt: null,
  },
  {
    id: 'task-8', title: '移动端适配优化', description: '优化移动端响应式布局和触控交互体验', assignee: 'tm-4',
    priority: 'low', status: 'todo', estimatedHours: 8, completedHours: 0, sprintId: null, createdAt: '2026-06-14', completedAt: null,
  },
]

const DEFAULT_SPRINT: Sprint = {
  id: 'sprint-1',
  name: 'Sprint 1 - 核心功能开发',
  startDate: '2026-06-15',
  endDate: '2026-06-29',
  teamMembers: ['tm-1', 'tm-2', 'tm-3', 'tm-4'],
  taskIds: [],
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T
  } catch { /* ignore */ }
  return fallback
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch { /* ignore */ }
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: loadFromStorage<Task[]>('sprint-tasks', DEFAULT_TASKS),
  sprints: loadFromStorage<Sprint[]>('sprint-sprints', [DEFAULT_SPRINT]),
  teamMembers: DEFAULT_TEAM_MEMBERS,
  currentSprintId: loadFromStorage<string | null>('sprint-currentSprintId', 'sprint-1'),
  editingTaskId: null,
  isCreateSprintOpen: false,
  sidebarOpen: false,

  setTasks: (tasks) => { saveToStorage('sprint-tasks', tasks); set({ tasks }) },
  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString().split('T')[0],
      completedAt: null,
    }
    const tasks = [...get().tasks, newTask]
    saveToStorage('sprint-tasks', tasks)
    set({ tasks })
  },
  updateTask: (id, updates) => {
    const tasks = get().tasks.map(t => {
      if (t.id !== id) return t
      const updated = { ...t, ...updates }
      if (updates.status === 'done' && t.status !== 'done') {
        updated.completedAt = new Date().toISOString().split('T')[0]
        updated.completedHours = t.estimatedHours
      }
      if (updates.status === 'todo' || updates.status === 'in-progress') {
        updated.completedAt = null
        if (updates.status === 'todo') updated.completedHours = 0
      }
      return updated
    })
    saveToStorage('sprint-tasks', tasks)
    set({ tasks })
  },
  deleteTask: (id) => {
    const tasks = get().tasks.filter(t => t.id !== id)
    const sprints = get().sprints.map(s => ({
      ...s,
      taskIds: s.taskIds.filter(tid => tid !== id),
    }))
    saveToStorage('sprint-tasks', tasks)
    saveToStorage('sprint-sprints', sprints)
    set({ tasks, sprints })
  },
  setSprints: (sprints) => { saveToStorage('sprint-sprints', sprints); set({ sprints }) },
  addSprint: (sprint) => {
    const newSprint: Sprint = { ...sprint, id: uuidv4(), taskIds: [] }
    const sprints = [...get().sprints, newSprint]
    saveToStorage('sprint-sprints', sprints)
    set({ sprints, currentSprintId: newSprint.id })
  },
  updateSprint: (id, updates) => {
    const sprints = get().sprints.map(s => s.id === id ? { ...s, ...updates } : s)
    saveToStorage('sprint-sprints', sprints)
    set({ sprints })
  },
  deleteSprint: (id) => {
    const tasks = get().tasks.map(t => t.sprintId === id ? { ...t, sprintId: null } : t)
    const sprints = get().sprints.filter(s => s.id !== id)
    saveToStorage('sprint-tasks', tasks)
    saveToStorage('sprint-sprints', sprints)
    set({ tasks, sprints, currentSprintId: sprints.length > 0 ? sprints[0].id : null })
  },
  addTaskToSprint: (sprintId, taskId) => {
    const sprints = get().sprints.map(s =>
      s.id === sprintId ? { ...s, taskIds: [...s.taskIds, taskId] } : s
    )
    const tasks = get().tasks.map(t =>
      t.id === taskId ? { ...t, sprintId } : t
    )
    saveToStorage('sprint-sprints', sprints)
    saveToStorage('sprint-tasks', tasks)
    set({ sprints, tasks })
  },
  removeTaskFromSprint: (sprintId, taskId) => {
    const sprints = get().sprints.map(s =>
      s.id === sprintId ? { ...s, taskIds: s.taskIds.filter(tid => tid !== taskId) } : s
    )
    const tasks = get().tasks.map(t =>
      t.id === taskId ? { ...t, sprintId: null } : t
    )
    saveToStorage('sprint-sprints', sprints)
    saveToStorage('sprint-tasks', tasks)
    set({ sprints, tasks })
  },
  setCurrentSprintId: (id) => { saveToStorage('sprint-currentSprintId', id); set({ currentSprintId: id }) },
  setEditingTaskId: (id) => set({ editingTaskId: id }),
  setCreateSprintOpen: (open) => set({ isCreateSprintOpen: open }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
