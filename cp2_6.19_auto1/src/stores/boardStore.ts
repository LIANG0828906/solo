import { reactive, computed } from 'vue'

export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'inProgress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  dueDate: string
  status: TaskStatus
}

export interface Project {
  id: string
  name: string
}

interface BoardState {
  tasks: Task[]
  projects: Project[]
  selectedProjectId: string
  filterKeyword: string
  filterPriority: Priority | 'all'
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const initialTasks: Task[] = [
  { id: generateId(), title: '设计系统架构', description: '完成整体系统架构设计方案，包含前端、后端和数据库', priority: 'high', dueDate: '2026-06-25', status: 'todo' },
  { id: generateId(), title: '用户登录模块', description: '实现JWT认证和权限控制', priority: 'high', dueDate: '2026-06-28', status: 'todo' },
  { id: generateId(), title: '编写API文档', description: '使用Swagger编写接口文档', priority: 'medium', dueDate: '2026-06-30', status: 'inProgress' },
  { id: generateId(), title: '数据库优化', description: '优化慢查询，建立索引', priority: 'medium', dueDate: '2026-07-01', status: 'inProgress' },
  { id: generateId(), title: '项目初始化', description: '搭建基础项目框架', priority: 'low', dueDate: '2026-06-15', status: 'done' },
  { id: generateId(), title: '需求分析', description: '完成需求规格说明书', priority: 'low', dueDate: '2026-06-10', status: 'done' },
]

const initialProjects: Project[] = [
  { id: 'proj-1', name: '电商平台' },
  { id: 'proj-2', name: 'OA系统' },
  { id: 'proj-3', name: '数据中台' },
]

const state = reactive<BoardState>({
  tasks: initialTasks,
  projects: initialProjects,
  selectedProjectId: 'proj-1',
  filterKeyword: '',
  filterPriority: 'all',
})

const filteredTasks = computed(() => {
  return state.tasks.filter(task => {
    const matchKeyword = !state.filterKeyword || 
      task.title.includes(state.filterKeyword) || 
      task.description.includes(state.filterKeyword)
    const matchPriority = state.filterPriority === 'all' || task.priority === state.filterPriority
    return matchKeyword && matchPriority
  })
})

const tasksByStatus = computed(() => {
  const todo = filteredTasks.value.filter(t => t.status === 'todo')
  const inProgress = filteredTasks.value.filter(t => t.status === 'inProgress')
  const done = filteredTasks.value.filter(t => t.status === 'done')
  return { todo, inProgress, done }
})

const addTask = (task: Omit<Task, 'id' | 'status'>, status: TaskStatus = 'todo') => {
  state.tasks.push({
    ...task,
    id: generateId(),
    status,
  })
}

const updateTask = (id: string, updates: Partial<Omit<Task, 'id'>>) => {
  const index = state.tasks.findIndex(t => t.id === id)
  if (index !== -1) {
    state.tasks[index] = { ...state.tasks[index], ...updates }
  }
}

const deleteTask = (id: string) => {
  const index = state.tasks.findIndex(t => t.id === id)
  if (index !== -1) {
    state.tasks.splice(index, 1)
  }
}

const moveTask = (taskId: string, newStatus: TaskStatus) => {
  const task = state.tasks.find(t => t.id === taskId)
  if (task) {
    task.status = newStatus
  }
}

const setFilterKeyword = (keyword: string) => {
  state.filterKeyword = keyword
}

const setFilterPriority = (priority: Priority | 'all') => {
  state.filterPriority = priority
}

const selectProject = (projectId: string) => {
  state.selectedProjectId = projectId
}

export const useBoardStore = () => {
  return {
    state,
    filteredTasks,
    tasksByStatus,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    setFilterKeyword,
    setFilterPriority,
    selectProject,
  }
}
