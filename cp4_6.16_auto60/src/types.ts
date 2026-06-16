/**
 * ============================================================
 *  QuizBurst 核心类型定义
 * ============================================================
 *
 *  依赖关系：零依赖，被所有功能模块引用
 *  数据流向：作为数据契约，定义 store 存储的数据结构和组件间传递的数据格式
 *
 *  引用此文件的模块：
 *  - src/store.ts              (状态管理)
 *  - src/components/QuizPanel.tsx  (主持人面板)
 *  - src/components/TeamBoard.tsx  (积分面板)
 *  - src/components/BuzzerPage.tsx (抢答页面)
 *  - src/components/ScoreLog.tsx   (得分日志)
 * ============================================================
 */

export type QuestionType = 'single' | 'truefalse'

export interface Question {
  id: string
  type: QuestionType
  content: string
  options: string[]
  correctAnswer: number
  timeLimit: number
  tags: string[]
  createdAt: number
}

export interface Team {
  id: string
  name: string
  color: string
  score: number
  order: number
}

export type QuizPhase = 'idle' | 'countdown' | 'buzzing' | 'answering' | 'result'

export type AnswerResult = 'correct' | 'wrong' | 'timeout'

export interface QuizSession {
  currentQuestionIndex: number
  phase: QuizPhase
  buzzedTeamId: string | null
  isAnswerRevealed: boolean
  countdownStartTime: number | null
  answerStartTime: number | null
}

export interface ScoreLog {
  id: string
  teamId: string
  teamName: string
  questionId: string
  questionContent: string
  scoreChange: number
  timestamp: number
  result: AnswerResult
}

export const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#14b8a6',
]
