export type TaskCategory = 'work' | 'study' | 'health'

export type TaskDifficulty = 'easy' | 'medium' | 'hard'

export interface Task {
  id: string
  title: string
  dueDate: string
  category: TaskCategory
  difficulty: TaskDifficulty
  completed: boolean
  completedAt?: string
}

export interface SkillNode {
  id: string
  category: TaskCategory
  name: string
  icon: string
  color: string
  expanded: boolean
  tasks: Task[]
}

export interface WeeklyDataPoint {
  day: string
  count: number
}

export interface CategoryDistribution {
  category: TaskCategory
  name: string
  count: number
  color: string
}
