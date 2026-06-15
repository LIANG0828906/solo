export interface Student {
  id: string
  name: string
  studentId: string
}

export interface Teacher {
  id: string
  name: string
  teacherId: string
  password: string
}

export type ScoreType = 'archery' | 'touhu' | 'cuju'

export interface ArcheryDetail {
  rings: number[]
  totalScore: number
}

export interface TouhuDetail {
  hits: number
  totalArrows: number
}

export interface CujuShot {
  power: number
  angle: number
  score: number
}

export interface CujuDetail {
  shots: CujuShot[]
  totalScore: number
}

export interface ScoreRecord {
  id: string
  studentId: string
  type: ScoreType
  score: number
  detail: ArcheryDetail | TouhuDetail | CujuDetail
  createdAt: string
}

export interface TrainingPlan {
  id: string
  date: string
  project: ScoreType
  content: string
  targetScore: number
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface LeaderboardEntry {
  studentId: string
  studentName: string
  archery: number | null
  touhu: number | null
  cuju: number | null
  total: number
  rank: number
}

export interface RankingTrend {
  month: string
  rank: number
}

const students = new Map<string, Student>()
const teachers = new Map<string, Teacher>()
const scoreRecords: ScoreRecord[] = []
const trainingPlans = new Map<string, TrainingPlan>()

let scoreIdCounter = 1
let planIdCounter = 1

function initSeedData() {
  const seedStudents: Student[] = [
    { id: 's1', name: '张子轩', studentId: '2024001' },
    { id: 's2', name: '李书瑶', studentId: '2024002' },
    { id: 's3', name: '王明德', studentId: '2024003' },
    { id: 's4', name: '赵文博', studentId: '2024004' },
    { id: 's5', name: '陈思远', studentId: '2024005' },
  ]
  seedStudents.forEach((s) => students.set(s.id, s))

  const seedTeacher: Teacher = {
    id: 't1',
    name: '夫子',
    teacherId: 'T001',
    password: '123456',
  }
  teachers.set(seedTeacher.id, seedTeacher)

  const now = new Date()
  const months: string[] = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toISOString().slice(0, 7))
  }

  const types: ScoreType[] = ['archery', 'touhu', 'cuju']

  seedStudents.forEach((student) => {
    types.forEach((type) => {
      months.forEach((month) => {
        const date = new Date(
          parseInt(month.slice(0, 4)),
          parseInt(month.slice(5, 7)) - 1,
          Math.floor(Math.random() * 28) + 1,
        )
        const detail = generateDetail(type)
        const record: ScoreRecord = {
          id: `sc${scoreIdCounter++}`,
          studentId: student.id,
          type,
          score: extractScore(type, detail),
          detail,
          createdAt: date.toISOString(),
        }
        scoreRecords.push(record)
      })
    })
  })

  const planTypes: ScoreType[] = ['archery', 'touhu', 'cuju']
  planTypes.forEach((type, i) => {
    const plan: TrainingPlan = {
      id: `p${planIdCounter++}`,
      title: `${type === 'archery' ? '射艺' : type === 'touhu' ? '投壶' : '蹴鞠'}训练计划`,
      content: `本学期${type === 'archery' ? '射艺' : type === 'touhu' ? '投壶' : '蹴鞠'}专项训练，循序渐进提升技艺。`,
      type,
      published: true,
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
      updatedAt: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
    }
    trainingPlans.set(plan.id, plan)
  })
}

function generateDetail(type: ScoreType): ArcheryDetail | TouhuDetail | CujuDetail {
  if (type === 'archery') {
    const rings = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10) + 1)
    return { rings, totalScore: rings.reduce((a, b) => a + b, 0) }
  }
  if (type === 'touhu') {
    const hits = Math.floor(Math.random() * 11)
    return { hits, totalArrows: 10 }
  }
  const shots = Array.from({ length: 5 }, () => ({
    power: Math.round(Math.random() * 100) / 10,
    angle: Math.round(Math.random() * 100) / 10,
    score: Math.round(Math.random() * 100) / 10,
  }))
  return { shots, totalScore: Math.round(shots.reduce((a, s) => a + s.score, 0) * 10) / 10 }
}

function extractScore(type: ScoreType, detail: ArcheryDetail | TouhuDetail | CujuDetail): number {
  if (type === 'archery') return (detail as ArcheryDetail).totalScore
  if (type === 'touhu') return (detail as TouhuDetail).hits
  return (detail as CujuDetail).totalScore
}

initSeedData()

export function findStudentByNameAndId(name: string, studentId: string): Student | undefined {
  for (const s of students.values()) {
    if (s.name === name && s.studentId === studentId) return s
  }
  return undefined
}

export function findStudentById(id: string): Student | undefined {
  return students.get(id)
}

export function findTeacherByCredentials(teacherId: string, password: string): Teacher | undefined {
  for (const t of teachers.values()) {
    if (t.teacherId === teacherId && t.password === password) return t
  }
  return undefined
}

export function getAllScores(type?: string, period?: string): ScoreRecord[] {
  let results = [...scoreRecords]
  if (type) results = results.filter((r) => r.type === type)
  if (period) results = results.filter((r) => r.createdAt.slice(0, 7) === period)
  return results
}

export function getScoreById(id: string): ScoreRecord | undefined {
  return scoreRecords.find((r) => r.id === id)
}

export function updateScore(id: string, updates: Partial<Pick<ScoreRecord, 'score' | 'detail'>>): ScoreRecord | undefined {
  const record = scoreRecords.find((r) => r.id === id)
  if (!record) return undefined
  if (updates.score !== undefined) record.score = updates.score
  if (updates.detail !== undefined) record.detail = updates.detail
  return record
}

export function deleteScore(id: string): boolean {
  const idx = scoreRecords.findIndex((r) => r.id === id)
  if (idx === -1) return false
  scoreRecords.splice(idx, 1)
  return true
}

export function addScore(data: Omit<ScoreRecord, 'id' | 'createdAt'>): ScoreRecord {
  const record: ScoreRecord = {
    ...data,
    id: `sc${scoreIdCounter++}`,
    createdAt: new Date().toISOString(),
  }
  scoreRecords.push(record)
  return record
}

export function getLeaderboard(month: string): LeaderboardEntry[] {
  const monthRecords = scoreRecords.filter((r) => r.createdAt.slice(0, 7) === month)

  const studentScores = new Map<string, Map<ScoreType, number>>()

  for (const record of monthRecords) {
    if (!studentScores.has(record.studentId)) {
      studentScores.set(record.studentId, new Map())
    }
    const typeMap = studentScores.get(record.studentId)!
    const current = typeMap.get(record.type) ?? -1
    if (record.score > current) {
      typeMap.set(record.type, record.score)
    }
  }

  const entries: LeaderboardEntry[] = []
  for (const [studentId, typeMap] of studentScores) {
    const student = students.get(studentId)
    if (!student) continue
    const archery = typeMap.get('archery') ?? null
    const touhu = typeMap.get('touhu') ?? null
    const cuju = typeMap.get('cuju') ?? null
    const total = (archery ?? 0) + (touhu ?? 0) + (cuju ?? 0)
    entries.push({
      studentId,
      studentName: student.name,
      archery,
      touhu,
      cuju,
      total,
      rank: 0,
    })
  }

  entries.sort((a, b) => b.total - a.total)
  entries.forEach((e, i) => (e.rank = i + 1))

  return entries.slice(0, 10)
}

export function getRankingTrend(studentId: string): RankingTrend[] {
  const now = new Date()
  const months: string[] = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toISOString().slice(0, 7))
  }

  const trend: RankingTrend[] = []

  for (const month of months) {
    const leaderboard = getLeaderboard(month)
    const entry = leaderboard.find((e) => e.studentId === studentId)
    trend.push({
      month,
      rank: entry ? entry.rank : 0,
    })
  }

  return trend
}

export function getAllPublishedPlans(): TrainingPlan[] {
  const result: TrainingPlan[] = []
  for (const plan of trainingPlans.values()) {
    if (plan.published) result.push(plan)
  }
  return result
}

export function getPlanById(id: string): TrainingPlan | undefined {
  return trainingPlans.get(id)
}

export function createPlan(data: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>): TrainingPlan {
  const now = new Date().toISOString()
  const plan: TrainingPlan = {
    ...data,
    id: `p${planIdCounter++}`,
    createdAt: now,
    updatedAt: now,
  }
  trainingPlans.set(plan.id, plan)
  return plan
}

export function updatePlan(id: string, updates: Partial<Omit<TrainingPlan, 'id' | 'createdAt'>>): TrainingPlan | undefined {
  const plan = trainingPlans.get(id)
  if (!plan) return undefined
  Object.assign(plan, updates, { updatedAt: new Date().toISOString() })
  return plan
}

export function deletePlan(id: string): boolean {
  return trainingPlans.delete(id)
}
