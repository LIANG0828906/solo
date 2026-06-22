/**
 * ============================================================
 *  QuizBurst 全局状态管理 (Zustand Store)
 * ============================================================
 *
 *  依赖关系：
 *    - 依赖: src/types.ts (核心类型定义)
 *    - 依赖: idb-keyval (IndexedDB 封装库)
 *    - 依赖: uuid (生成唯一ID)
 *
 *  数据流向：
 *    输入：组件调用 action 方法 → 更新 store 状态 → 触发视图重渲染
 *    持久化：状态变化时自动同步到 IndexedDB
 *    初始化：应用启动时从 IndexedDB 加载数据到 store
 *
 *  引用此 store 的组件：
 *    - src/components/QuizPanel.tsx  (题目管理、比赛控制)
 *    - src/components/TeamBoard.tsx  (小组数据读取、拖拽排序)
 *    - src/components/BuzzerPage.tsx (抢答操作、得分记录)
 *    - src/components/ScoreLog.tsx   (得分日志读取、筛选)
 *
 *  与 QuizPanel 的交互：
 *    - QuizPanel 调用 addQuestion/updateQuestion/deleteQuestion 管理题目
 *    - QuizPanel 调用 startCountdown/nextQuestion 控制比赛流程
 *    - QuizPanel 读取 session/questions 状态展示当前信息
 *
 *  与 BuzzerPage 的交互：
 *    - BuzzerPage 读取 session/questions 展示题目和倒计时
 *    - BuzzerPage 调用 buzz/submitAnswer 处理抢答和答题
 *    - BuzzerPage 读取 teams 信息用于小组确认弹窗
 * ============================================================
 */

import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import { v4 as uuidv4 } from 'uuid'
import type {
  Question,
  QuestionType,
  Team,
  QuizSession,
  ScoreLog,
  AnswerResult,
} from './types'

const CORRECT_SCORE = 10
const WRONG_SCORE = -5

interface QuizStore {
  questions: Question[]
  teams: Team[]
  session: QuizSession
  scoreLogs: ScoreLog[]
  isLoaded: boolean

  loadFromDB: () => Promise<void>
  saveToDB: () => Promise<void>

  addQuestion: (data: Omit<Question, 'id' | 'createdAt'>) => void
  updateQuestion: (id: string, data: Partial<Question>) => void
  deleteQuestion: (id: string) => void

  addTeam: (name: string, color: string) => void
  updateTeam: (id: string, data: Partial<Team>) => void
  deleteTeam: (id: string) => void
  reorderTeams: (activeId: string, overId: string) => void

  startCountdown: () => void
  startBuzzing: () => void
  buzz: (teamId: string) => boolean
  cancelBuzz: () => void
  confirmBuzz: () => void
  submitAnswer: (answerIndex: number) => void
  revealAnswer: () => void
  nextQuestion: () => void
  resetSession: () => void

  recordScore: (
    teamId: string,
    questionId: string,
    scoreChange: number,
    result: AnswerResult,
  ) => void

  getCurrentQuestion: () => Question | null
  getTeamById: (id: string) => Team | undefined
}

const initialSession: QuizSession = {
  currentQuestionIndex: 0,
  phase: 'idle',
  buzzedTeamId: null,
  isAnswerRevealed: false,
  countdownStartTime: null,
  answerStartTime: null,
}

const sampleQuestions: Question[] = [
  {
    id: uuidv4(),
    type: 'single',
    content: '中国的首都是哪个城市？',
    options: ['上海', '北京', '广州', '深圳'],
    correctAnswer: 1,
    timeLimit: 15,
    tags: ['地理', '中国'],
    createdAt: Date.now(),
  },
  {
    id: uuidv4(),
    type: 'truefalse',
    content: '地球是太阳系中最大的行星。',
    options: ['正确', '错误'],
    correctAnswer: 1,
    timeLimit: 10,
    tags: ['科学', '天文'],
    createdAt: Date.now(),
  },
  {
    id: uuidv4(),
    type: 'single',
    content: '《红楼梦》的作者是谁？',
    options: ['罗贯中', '施耐庵', '曹雪芹', '吴承恩'],
    correctAnswer: 2,
    timeLimit: 20,
    tags: ['历史', '文学'],
    createdAt: Date.now(),
  },
  {
    id: uuidv4(),
    type: 'truefalse',
    content: '水的化学分子式是H2O。',
    options: ['正确', '错误'],
    correctAnswer: 0,
    timeLimit: 10,
    tags: ['科学', '化学'],
    createdAt: Date.now(),
  },
]

const sampleTeams: Team[] = [
  { id: uuidv4(), name: '红队', color: '#ef4444', score: 0, order: 0 },
  { id: uuidv4(), name: '蓝队', color: '#3b82f6', score: 0, order: 1 },
  { id: uuidv4(), name: '绿队', color: '#22c55e', score: 0, order: 2 },
  { id: uuidv4(), name: '紫队', color: '#8b5cf6', score: 0, order: 3 },
]

export const useQuizStore = create<QuizStore>((set, get) => ({
  questions: sampleQuestions,
  teams: sampleTeams,
  session: initialSession,
  scoreLogs: [],
  isLoaded: false,

  loadFromDB: async () => {
    try {
      const [questions, teams, scoreLogs] = await Promise.all([
        idbGet('quizburst_questions') as Promise<Question[] | undefined>,
        idbGet('quizburst_teams') as Promise<Team[] | undefined>,
        idbGet('quizburst_scoreLogs') as Promise<ScoreLog[] | undefined>,
      ])

      set({
        questions: questions && questions.length > 0 ? questions : sampleQuestions,
        teams: teams && teams.length > 0 ? teams : sampleTeams,
        scoreLogs: scoreLogs || [],
        isLoaded: true,
      })
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error)
      set({ isLoaded: true })
    }
  },

  saveToDB: async () => {
    const { questions, teams, scoreLogs } = get()
    try {
      await Promise.all([
        idbSet('quizburst_questions', questions),
        idbSet('quizburst_teams', teams),
        idbSet('quizburst_scoreLogs', scoreLogs),
      ])
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error)
    }
  },

  addQuestion: (data) => {
    const newQuestion: Question = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
    }
    set((state) => ({ questions: [...state.questions, newQuestion] }))
    get().saveToDB()
  },

  updateQuestion: (id, data) => {
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...data } : q,
      ),
    }))
    get().saveToDB()
  },

  deleteQuestion: (id) => {
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
    }))
    get().saveToDB()
  },

  addTeam: (name, color) => {
    const { teams } = get()
    if (teams.length >= 8) return

    const newTeam: Team = {
      id: uuidv4(),
      name,
      color,
      score: 0,
      order: teams.length,
    }
    set((state) => ({ teams: [...state.teams, newTeam] }))
    get().saveToDB()
  },

  updateTeam: (id, data) => {
    set((state) => ({
      teams: state.teams.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }))
    get().saveToDB()
  },

  deleteTeam: (id) => {
    set((state) => {
      const filtered = state.teams.filter((t) => t.id !== id)
      return {
        teams: filtered.map((t, idx) => ({ ...t, order: idx })),
      }
    })
    get().saveToDB()
  },

  reorderTeams: (activeId, overId) => {
    set((state) => {
      const teams = [...state.teams]
      const activeIdx = teams.findIndex((t) => t.id === activeId)
      const overIdx = teams.findIndex((t) => t.id === overId)

      if (activeIdx === -1 || overIdx === -1) return state

      const [activeTeam] = teams.splice(activeIdx, 1)
      teams.splice(overIdx, 0, activeTeam)

      return {
        teams: teams.map((t, idx) => ({ ...t, order: idx })),
      }
    })
    get().saveToDB()
  },

  startCountdown: () => {
    const { questions, session } = get()
    if (questions.length === 0) return

    set({
      session: {
        ...session,
        phase: 'countdown',
        buzzedTeamId: null,
        isAnswerRevealed: false,
        countdownStartTime: Date.now(),
        answerStartTime: null,
      },
    })
  },

  startBuzzing: () => {
    const { session } = get()
    set({
      session: {
        ...session,
        phase: 'buzzing',
        buzzedTeamId: null,
        isAnswerRevealed: false,
      },
    })
  },

  buzz: (teamId) => {
    const { session } = get()
    if (session.phase !== 'buzzing' || session.buzzedTeamId) return false

    set({
      session: {
        ...session,
        buzzedTeamId: teamId,
        phase: 'answering',
      },
    })
    return true
  },

  cancelBuzz: () => {
    const { session } = get()
    set({
      session: {
        ...session,
        buzzedTeamId: null,
        phase: 'buzzing',
      },
    })
  },

  confirmBuzz: () => {
    const { session, questions, getCurrentQuestion } = get()
    const question = getCurrentQuestion()
    if (!question) return

    set({
      session: {
        ...session,
        answerStartTime: Date.now(),
      },
    })
  },

  submitAnswer: (answerIndex) => {
    const { session, questions, getCurrentQuestion, getTeamById, recordScore } =
      get()
    const question = getCurrentQuestion()
    if (!question || !session.buzzedTeamId) return

    const team = getTeamById(session.buzzedTeamId)
    if (!team) return

    const isCorrect = answerIndex === question.correctAnswer
    const scoreChange = isCorrect ? CORRECT_SCORE : WRONG_SCORE
    const result: AnswerResult = isCorrect ? 'correct' : 'wrong'

    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === session.buzzedTeamId
          ? { ...t, score: Math.max(0, t.score + scoreChange) }
          : t,
      ),
      session: {
        ...session,
        isAnswerRevealed: true,
        phase: 'result',
      },
    }))

    recordScore(session.buzzedTeamId, question.id, scoreChange, result)
  },

  revealAnswer: () => {
    const { session } = get()
    set({
      session: {
        ...session,
        isAnswerRevealed: true,
        phase: 'result',
      },
    })
  },

  nextQuestion: () => {
    const { session, questions } = get()
    const nextIndex = (session.currentQuestionIndex + 1) % questions.length

    set({
      session: {
        currentQuestionIndex: nextIndex,
        phase: 'idle',
        buzzedTeamId: null,
        isAnswerRevealed: false,
        countdownStartTime: null,
        answerStartTime: null,
      },
    })
  },

  resetSession: () => {
    set({ session: { ...initialSession } })
  },

  recordScore: (teamId, questionId, scoreChange, result) => {
    const { getTeamById, getCurrentQuestion } = get()
    const team = getTeamById(teamId)
    const question = getCurrentQuestion()
    if (!team || !question) return

    const log: ScoreLog = {
      id: uuidv4(),
      teamId,
      teamName: team.name,
      questionId,
      questionContent: question.content,
      scoreChange,
      timestamp: Date.now(),
      result,
    }

    set((state) => ({ scoreLogs: [log, ...state.scoreLogs] }))
    get().saveToDB()
  },

  getCurrentQuestion: () => {
    const { questions, session } = get()
    if (questions.length === 0) return null
    return questions[session.currentQuestionIndex] || null
  },

  getTeamById: (id) => {
    return get().teams.find((t) => t.id === id)
  },
}))
