import { v4 as uuidv4 } from 'uuid'
import type { Job, Resume, Interview, Score } from '../shared/types.js'

const job1Id = uuidv4()
const job2Id = uuidv4()
const job3Id = uuidv4()

const resume1Id = uuidv4()
const resume2Id = uuidv4()
const resume3Id = uuidv4()
const resume4Id = uuidv4()
const resume5Id = uuidv4()

export const jobs: Job[] = [
  {
    id: job1Id,
    title: '前端工程师',
    department: '技术部',
    location: '北京',
    salaryMin: 15000,
    salaryMax: 30000,
    description: '负责公司前端产品的开发和维护，熟练掌握React/Vue等主流框架，具备良好的工程化和组件化思维。',
    createdAt: '2026-05-01T08:00:00.000Z',
  },
  {
    id: job2Id,
    title: '后端工程师',
    department: '技术部',
    location: '上海',
    salaryMin: 18000,
    salaryMax: 35000,
    description: '负责后端服务架构设计与开发，熟悉Node.js/Java/Go等语言，有高并发系统设计经验者优先。',
    createdAt: '2026-05-10T08:00:00.000Z',
  },
  {
    id: job3Id,
    title: '产品经理',
    department: '产品部',
    location: '深圳',
    salaryMin: 20000,
    salaryMax: 40000,
    description: '负责产品规划与需求分析，具备优秀的数据分析能力和用户洞察力，有B端产品经验者优先。',
    createdAt: '2026-05-15T08:00:00.000Z',
  },
]

const score1Id = uuidv4()
const score2Id = uuidv4()
const score3Id = uuidv4()

const score1: Score = {
  id: score1Id,
  resumeId: resume2Id,
  interviewer: '张经理',
  rating: 85,
  comment: '技术基础扎实，项目经验丰富，沟通能力良好。',
  createdAt: '2026-06-01T10:00:00.000Z',
}

const score2: Score = {
  id: score2Id,
  resumeId: resume2Id,
  interviewer: '李总监',
  rating: 90,
  comment: '综合素质优秀，解决问题能力强，推荐录用。',
  createdAt: '2026-06-01T14:00:00.000Z',
}

const score3: Score = {
  id: score3Id,
  resumeId: resume3Id,
  interviewer: '王主管',
  rating: 78,
  comment: '基本满足岗位要求，但需要进一步考察系统设计能力。',
  createdAt: '2026-06-02T11:00:00.000Z',
}

export const resumes: Resume[] = [
  {
    id: resume1Id,
    name: '赵六',
    email: 'zhaoliu@example.com',
    phone: '13800000005',
    jobId: job1Id,
    jobTitle: '前端工程师',
    fileName: '赵六_前端工程师_简历.pdf',
    uploadedAt: '2026-05-20T09:00:00.000Z',
    status: 'pending',
    scores: [],
    averageScore: 0,
  },
  {
    id: resume2Id,
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800000001',
    jobId: job2Id,
    jobTitle: '后端工程师',
    fileName: '张三_后端工程师_简历.pdf',
    uploadedAt: '2026-05-18T10:00:00.000Z',
    status: 'hired',
    scores: [score1, score2],
    averageScore: 87.5,
  },
  {
    id: resume3Id,
    name: '李四',
    email: 'lisi@example.com',
    phone: '13800000002',
    jobId: job2Id,
    jobTitle: '后端工程师',
    fileName: '李四_后端工程师_简历.pdf',
    uploadedAt: '2026-05-19T11:00:00.000Z',
    status: 'interviewed',
    scores: [score3],
    averageScore: 78,
  },
  {
    id: resume4Id,
    name: '王五',
    email: 'wangwu@example.com',
    phone: '13800000003',
    jobId: job3Id,
    jobTitle: '产品经理',
    fileName: '王五_产品经理_简历.pdf',
    uploadedAt: '2026-05-21T14:00:00.000Z',
    status: 'rejected',
    scores: [],
    averageScore: 0,
  },
  {
    id: resume5Id,
    name: '孙七',
    email: 'sunqi@example.com',
    phone: '13800000004',
    jobId: job1Id,
    jobTitle: '前端工程师',
    fileName: '孙七_前端工程师_简历.pdf',
    uploadedAt: '2026-05-22T08:30:00.000Z',
    status: 'pending',
    scores: [],
    averageScore: 0,
  },
]

export const interviews: Interview[] = [
  {
    id: uuidv4(),
    resumeId: resume2Id,
    candidateName: '张三',
    jobTitle: '后端工程师',
    date: '2026-06-01',
    timeSlot: '10:00',
    status: 'completed',
  },
  {
    id: uuidv4(),
    resumeId: resume3Id,
    candidateName: '李四',
    jobTitle: '后端工程师',
    date: '2026-06-02',
    timeSlot: '14:00',
    status: 'completed',
  },
  {
    id: uuidv4(),
    resumeId: resume1Id,
    candidateName: '赵六',
    jobTitle: '前端工程师',
    date: '2026-06-15',
    timeSlot: '09:00',
    status: 'scheduled',
  },
]

export const scores: Score[] = [score1, score2, score3]

export function getOccupiedSlots(date: string): string[] {
  return interviews
    .filter((i) => i.date === date && i.status !== 'cancelled')
    .map((i) => i.timeSlot)
}
