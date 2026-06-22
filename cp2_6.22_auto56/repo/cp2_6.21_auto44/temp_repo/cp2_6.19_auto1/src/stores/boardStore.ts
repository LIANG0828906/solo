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

const createInitialTasks = (): Task[] => [
  { id: generateId(), title: '设计系统架构', description: '完成整体系统架构设计方案，包含前端、后端和数据库', priority: 'high', dueDate: '2026-06-25', status: 'todo' },
  { id: generateId(), title: '用户登录模块', description: '实现JWT认证和权限控制', priority: 'high', dueDate: '2026-06-28', status: 'todo' },
  { id: generateId(), title: '前端页面开发', description: '完成首页和用户管理页面开发', priority: 'medium', dueDate: '2026-07-05', status: 'todo' },
  { id: generateId(), title: '接口联调测试', description: '与后端进行接口联调和集成测试', priority: 'low', dueDate: '2026-07-10', status: 'todo' },
  { id: generateId(), title: '编写API文档', description: '使用Swagger编写接口文档', priority: 'medium', dueDate: '2026-06-30', status: 'inProgress' },
  { id: generateId(), title: '数据库优化', description: '优化慢查询，建立索引', priority: 'medium', dueDate: '2026-07-01', status: 'inProgress' },
  { id: generateId(), title: 'CI/CD流水线搭建', description: '配置自动化构建和部署流程', priority: 'high', dueDate: '2026-06-27', status: 'inProgress' },
  { id: generateId(), title: '项目初始化', description: '搭建基础项目框架', priority: 'low', dueDate: '2026-06-15', status: 'done' },
  { id: generateId(), title: '需求分析', description: '完成需求规格说明书', priority: 'low', dueDate: '2026-06-10', status: 'done' },
  { id: generateId(), title: '技术选型评审', description: '完成技术栈选型和架构评审', priority: 'medium', dueDate: '2026-06-12', status: 'done' },
]

const initialProjects: Project[] = [
  { id: 'proj-1', name: '电商平台' },
  { id: 'proj-2', name: 'OA系统' },
  { id: 'proj-3', name: '数据中台' },
]

const state = reactive<BoardState>({
  tasks: createInitialTasks(),
  projects: initialProjects,
  selectedProjectId: 'proj-1',
  filterKeyword: '',
  filterPriority: 'all',
})

const filteredTasks = computed(() => {
  return state.tasks.filter(task => {
    const matchKeyword = !state.filterKeyword ||
      task.title.toLowerCase().includes(state.filterKeyword.toLowerCase()) ||
      task.description.toLowerCase().includes(state.filterKeyword.toLowerCase())
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

const filterByKeyword = (keyword: string) => {
  state.filterKeyword = keyword
}

const filterByPriority = (priority: Priority | 'all') => {
  state.filterPriority = priority
}

const setFilterKeyword = filterByKeyword
const setFilterPriority = filterByPriority

const selectProject = (projectId: string) => {
  state.selectedProjectId = projectId
}

const generateBulkTasks = (count: number) => {
  const priorities: Priority[] = ['high', 'medium', 'low']
  const statuses: TaskStatus[] = ['todo', 'inProgress', 'done']
  const titles = [
    '用户认证模块', '支付系统集成', '数据报表开发', '性能优化',
    '安全审计', '移动端适配', '缓存策略设计', '日志系统搭建',
    '消息队列集成', '搜索功能优化', '文件上传服务', '权限管理',
    '数据迁移脚本', '监控告警配置', 'API网关搭建', '单元测试覆盖',
    '代码审查流程', '文档编写', '国际化支持', '无障碍适配',
  ]
  const descriptions = [
    '完成模块设计和开发', '编写技术方案文档', '进行代码审查和重构',
    '配置部署环境和流程', '优化系统性能和稳定性', '编写自动化测试用例',
  ]

  for (let i = 0; i < count; i++) {
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const title = titles[Math.floor(Math.random() * titles.length)]
    const desc = descriptions[Math.floor(Math.random() * descriptions.length)]
    const dueDay = Math.floor(Math.random() * 60) + 10
    const dueDate = new Date(2026, 5, dueDay).toISOString().split('T')[0]

    state.tasks.push({
      id: generateId() + i,
      title: `${title} #${i + 1}`,
      description: desc,
      priority,
      dueDate,
      status,
    })
  }
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
    filterByKeyword,
    filterByPriority,
    setFilterKeyword,
    setFilterPriority,
    selectProject,
    generateBulkTasks,
  }
}
