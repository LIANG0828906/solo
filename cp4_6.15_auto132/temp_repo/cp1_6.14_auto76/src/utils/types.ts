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

export interface SkillMatrixEntry {
  employee: Employee
  skills: SkillScore
}

export const SKILL_LABELS: Record<string, string> = {
  coding: '编码能力',
  architecture: '架构设计',
  projectManagement: '项目管理',
  teamCollaboration: '团队协作',
  productThinking: '产品思维',
  businessUnderstanding: '业务理解'
}

export const SKILL_RECOMMENDATIONS: Record<string, { name: string; url: string }[]> = {
  coding: [
    { name: 'React 高级开发实战', url: '/employee/courses' },
    { name: 'LeetCode 算法训练', url: '/employee/courses' }
  ],
  architecture: [
    { name: '系统设计面试指南', url: '/employee/courses' },
    { name: '微服务架构实践', url: '/employee/courses' }
  ],
  projectManagement: [
    { name: '敏捷项目管理精要', url: '/employee/courses' },
    { name: 'PMP 认证备考', url: '/employee/courses' }
  ],
  teamCollaboration: [
    { name: '高效团队沟通', url: '/employee/courses' },
    { name: 'Scrum Master 训练', url: '/employee/courses' }
  ],
  productThinking: [
    { name: '产品思维与用户体验设计', url: '/employee/courses' },
    { name: '增长黑客实战', url: '/employee/courses' }
  ],
  businessUnderstanding: [
    { name: '商业模式分析', url: '/employee/courses' },
    { name: '数据驱动决策', url: '/employee/courses' }
  ]
}
