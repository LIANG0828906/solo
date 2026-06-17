import { v4 as uuidv4 } from 'uuid'
import type { SkillNode, Task, TaskCategory } from '@/types'

const CATEGORY_CONFIG: Record<TaskCategory, { name: string; icon: string; color: string }> = {
  work: { name: '工作', icon: '💼', color: '#6C63FF' },
  study: { name: '学习', icon: '📚', color: '#4ECDC4' },
  health: { name: '健康', icon: '💪', color: '#FF6B6B' },
}

const createInitialTasks = (category: TaskCategory): Task[] => {
  const samples: Record<TaskCategory, Array<{ title: string; dueDate: string; difficulty: Task['difficulty'] }>> = {
    work: [
      { title: '完成项目周报', dueDate: '2026-06-18', difficulty: 'easy' },
      { title: '代码评审与合并', dueDate: '2026-06-19', difficulty: 'medium' },
      { title: '架构方案设计', dueDate: '2026-06-21', difficulty: 'hard' },
    ],
    study: [
      { title: '阅读技术文档30分钟', dueDate: '2026-06-18', difficulty: 'easy' },
      { title: 'TypeScript 进阶学习', dueDate: '2026-06-20', difficulty: 'medium' },
      { title: '系统设计专题研究', dueDate: '2026-06-22', difficulty: 'hard' },
    ],
    health: [
      { title: '晨间拉伸10分钟', dueDate: '2026-06-18', difficulty: 'easy' },
      { title: '跑步5公里', dueDate: '2026-06-18', difficulty: 'medium' },
      { title: '健身力量训练', dueDate: '2026-06-19', difficulty: 'hard' },
    ],
  }
  return samples[category].map((s) => ({
    id: uuidv4(),
    title: s.title,
    dueDate: s.dueDate,
    category,
    difficulty: s.difficulty,
    completed: false,
  }))
}

export const fetchInitialSkillTree = (): Promise<SkillNode[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nodes: SkillNode[] = (Object.keys(CATEGORY_CONFIG) as TaskCategory[]).map((cat, idx) => ({
        id: uuidv4(),
        category: cat,
        name: CATEGORY_CONFIG[cat].name,
        icon: CATEGORY_CONFIG[cat].icon,
        color: CATEGORY_CONFIG[cat].color,
        expanded: idx === 0,
        tasks: createInitialTasks(cat),
      }))
      resolve(nodes)
    }, 300)
  })
}

export const getCategoryColor = (category: TaskCategory): string => CATEGORY_CONFIG[category].color
export const getCategoryName = (category: TaskCategory): string => CATEGORY_CONFIG[category].name
export const getCategoryIcon = (category: TaskCategory): string => CATEGORY_CONFIG[category].icon

export const DIFFICULTY_XP: Record<Task['difficulty'], number> = {
  easy: 5,
  medium: 10,
  hard: 20,
}

export const DIFFICULTY_LABEL: Record<Task['difficulty'], string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}
