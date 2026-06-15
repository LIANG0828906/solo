import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface CourseChapter {
  id: string
  title: string
  content: string
  order: number
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface Course {
  id: string
  name: string
  category: '技术类' | '管理类' | '产品类'
  difficulty: 1 | 2 | 3
  outline: CourseChapter[]
  quizzes: QuizQuestion[]
  targetSkills: string[]
  createdAt: string
}

export interface Enrollment {
  courseId: string
  progress: number
  completedChapters: string[]
  enrolledAt: string
}

export interface Employee {
  id: string
  name: string
  email: string
  team: string
  avatar: string
  enrollments: Enrollment[]
}

export interface QuizResult {
  id: string
  employeeId: string
  courseId: string
  score: number
  totalQuestions: number
  answers: { questionId: string; selected: number; correct: boolean }[]
  completedAt: string
}

export interface SkillScore {
  coding: number
  architecture: number
  projectManagement: number
  teamCollaboration: number
  productThinking: number
  businessUnderstanding: number
}

export interface SkillMatrix {
  employeeId: string
  skills: SkillScore
  updatedAt: string
}

export interface Database {
  courses: Course[]
  employees: Employee[]
  quizResults: QuizResult[]
  skillMatrix: SkillMatrix[]
}

const defaultData: Database = {
  courses: [
    {
      id: uuidv4(),
      name: 'React 高级开发实战',
      category: '技术类',
      difficulty: 3,
      outline: [
        { id: uuidv4(), title: '第一章：React Hooks 深度解析', content: '深入理解 useState、useEffect、useCallback、useMemo 等核心 Hooks 的原理和最佳实践。', order: 1 },
        { id: uuidv4(), title: '第二章：状态管理方案对比', content: 'Redux、Zustand、Jotai 等主流状态管理库的对比与选型。', order: 2 },
        { id: uuidv4(), title: '第三章：性能优化实战', content: '虚拟列表、代码分割、懒加载、记忆化等性能优化技术。', order: 3 },
        { id: uuidv4(), title: '第四章：测试策略', content: '单元测试、集成测试、E2E 测试的完整测试方案。', order: 4 }
      ],
      quizzes: [
        { id: uuidv4(), question: 'useEffect 的依赖数组为空时，effect 会在什么时候执行？', options: ['每次渲染后', '仅在组件挂载时', '仅在组件卸载时', '从不执行'], correctAnswer: 1, explanation: '依赖数组为空时，effect 只会在组件挂载时执行一次，类似于 componentDidMount。' },
        { id: uuidv4(), question: '以下哪个 Hook 适合用于缓存昂贵的计算结果？', options: ['useCallback', 'useMemo', 'useRef', 'useContext'], correctAnswer: 1, explanation: 'useMemo 用于缓存计算结果，只有依赖变化时才会重新计算。' },
        { id: uuidv4(), question: 'React.memo 和 useMemo 的主要区别是什么？', options: ['没有区别', 'React.memo 用于组件，useMemo 用于值', 'React.memo 用于值，useMemo 用于组件', 'React.memo 是类组件专用'], correctAnswer: 1, explanation: 'React.memo 是高阶组件，用于包裹组件避免不必要的重新渲染；useMemo 用于缓存计算值。' },
        { id: uuidv4(), question: '虚拟列表的主要作用是什么？', options: ['美化界面', '减少 DOM 节点数量提升性能', '支持无限滚动', '简化代码'], correctAnswer: 1, explanation: '虚拟列表只渲染可视区域内的元素，大幅减少 DOM 节点，提升长列表的渲染性能。' }
      ],
      targetSkills: ['coding', 'architecture'],
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: '敏捷项目管理精要',
      category: '管理类',
      difficulty: 2,
      outline: [
        { id: uuidv4(), title: '第一章：敏捷方法论基础', content: '敏捷宣言、12 大原则，以及 Scrum、Kanban 等主流敏捷框架介绍。', order: 1 },
        { id: uuidv4(), title: '第二章：Scrum 实战演练', content: 'Sprint 规划、每日站会、Sprint 评审、回顾会议的完整流程。', order: 2 },
        { id: uuidv4(), title: '第三章：用户故事与需求管理', content: '如何编写高质量的用户故事，INVEST 原则和需求优先级排序。', order: 3 }
      ],
      quizzes: [
        { id: uuidv4(), question: '敏捷宣言中最高优先级的是什么？', options: ['遵循计划', '工作的软件', '个体和互动', '客户合作'], correctAnswer: 2, explanation: '敏捷宣言第一条：个体和互动高于流程和工具。' },
        { id: uuidv4(), question: 'Scrum 中典型的 Sprint 长度是？', options: ['1-4 周', '1-2 个月', '1 天', '1 个季度'], correctAnswer: 0, explanation: 'Sprint 通常为 1-4 周，最常见的是 2 周。' },
        { id: uuidv4(), question: '用户故事的 INVEST 原则中 I 代表什么？', options: ['Important', 'Independent', 'Interesting', 'Integrated'], correctAnswer: 1, explanation: 'I 代表 Independent，即故事应尽可能独立，便于优先级排序和开发。' }
      ],
      targetSkills: ['projectManagement', 'teamCollaboration'],
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: '产品思维与用户体验设计',
      category: '产品类',
      difficulty: 2,
      outline: [
        { id: uuidv4(), title: '第一章：产品经理的核心思维', content: '用户思维、数据思维、商业思维的培养与应用。', order: 1 },
        { id: uuidv4(), title: '第二章：用户研究方法', content: '用户访谈、问卷调查、可用性测试等用户研究方法。', order: 2 },
        { id: uuidv4(), title: '第三章：原型设计与交互', content: '低保真和高保真原型设计，交互设计原则。', order: 3 }
      ],
      quizzes: [
        { id: uuidv4(), question: '产品设计中 MVP 指的是什么？', options: ['Most Valuable Player', 'Minimum Viable Product', 'Most Viable Product', 'Minimum Value Proposition'], correctAnswer: 1, explanation: 'MVP 是 Minimum Viable Product，最小可行产品，用最少的资源验证产品假设。' },
        { id: uuidv4(), question: '以下哪项是定量研究方法？', options: ['用户访谈', '问卷调查', '焦点小组', '可用性测试'], correctAnswer: 1, explanation: '问卷调查是定量研究，可以收集大量样本数据进行统计分析。' },
        { id: uuidv4(), question: '尼尔森十大可用性原则中不包括以下哪项？', options: ['系统状态可见性', '用户控制与自由', '美观最大化', '一致性与标准'], correctAnswer: 2, explanation: '尼尔森原则强调的是美学与极简设计，而非美观最大化。' }
      ],
      targetSkills: ['productThinking', 'businessUnderstanding'],
      createdAt: new Date().toISOString()
    }
  ],
  employees: [
    {
      id: uuidv4(),
      name: '张三',
      email: 'zhangsan@company.com',
      team: '技术研发部',
      avatar: '👨‍💻',
      enrollments: []
    },
    {
      id: uuidv4(),
      name: '李四',
      email: 'lisi@company.com',
      team: '技术研发部',
      avatar: '👩‍💻',
      enrollments: []
    },
    {
      id: uuidv4(),
      name: '王五',
      email: 'wangwu@company.com',
      team: '产品设计部',
      avatar: '🧑‍🎨',
      enrollments: []
    },
    {
      id: uuidv4(),
      name: '赵六',
      email: 'zhaoliu@company.com',
      team: '项目管理部',
      avatar: '👔',
      enrollments: []
    },
    {
      id: uuidv4(),
      name: '孙七',
      email: 'sunqi@company.com',
      team: '技术研发部',
      avatar: '🧑‍💻',
      enrollments: []
    }
  ],
  quizResults: [],
  skillMatrix: []
}

const file = join(__dirname, 'db.json')
const adapter = new JSONFile<Database>(file)
export const db = new Low<Database>(adapter, defaultData)

export async function initDB() {
  await db.read()
  if (!db.data) {
    db.data = defaultData
  }
  if (!db.data.courses) db.data.courses = defaultData.courses
  if (!db.data.employees) db.data.employees = defaultData.employees
  if (!db.data.quizResults) db.data.quizResults = defaultData.quizResults
  if (!db.data.skillMatrix) db.data.skillMatrix = defaultData.skillMatrix
  await db.write()
}
