import { create } from 'zustand'
import axios from 'axios'
import type { Job, Resume, Interview, Score } from '@shared/types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

interface AppState {
  jobs: Job[]
  resumes: Resume[]
  interviews: Interview[]
  scores: Score[]
  sidebarOpen: boolean
  loading: boolean

  setSidebarOpen: (open: boolean) => void

  fetchJobs: () => Promise<void>
  createJob: (job: Omit<Job, 'id' | 'createdAt'>) => Promise<void>

  fetchResumes: () => Promise<void>
  createResume: (resume: Omit<Resume, 'id' | 'uploadedAt' | 'status' | 'scores' | 'averageScore'>) => Promise<void>
  updateResumeStatus: (id: string, status: Resume['status']) => Promise<void>

  fetchInterviews: () => Promise<void>
  createInterview: (interview: Omit<Interview, 'id' | 'status'>) => Promise<void>
  getOccupiedSlots: (date: string) => Promise<string[]>

  createScore: (score: Omit<Score, 'id' | 'createdAt'>) => Promise<void>
  fetchScoresByResume: (resumeId: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  jobs: [],
  resumes: [],
  interviews: [],
  scores: [],
  sidebarOpen: false,
  loading: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  fetchJobs: async () => {
    set({ loading: true })
    try {
      const res = await axios.get<ApiResponse<Job[]>>('/api/jobs')
      set({ jobs: res.data.data })
    } finally {
      set({ loading: false })
    }
  },

  createJob: async (job) => {
    set({ loading: true })
    try {
      await axios.post('/api/jobs', job)
      await get().fetchJobs()
    } finally {
      set({ loading: false })
    }
  },

  fetchResumes: async () => {
    set({ loading: true })
    try {
      const res = await axios.get<ApiResponse<Resume[]>>('/api/resumes')
      set({ resumes: res.data.data })
    } finally {
      set({ loading: false })
    }
  },

  createResume: async (resume) => {
    set({ loading: true })
    try {
      await axios.post('/api/resumes', resume)
      await get().fetchResumes()
    } finally {
      set({ loading: false })
    }
  },

  updateResumeStatus: async (id, status) => {
    set({ loading: true })
    try {
      await axios.patch(`/api/resumes/${id}/status`, { status })
      await get().fetchResumes()
    } finally {
      set({ loading: false })
    }
  },

  fetchInterviews: async () => {
    set({ loading: true })
    try {
      const res = await axios.get<ApiResponse<Interview[]>>('/api/interviews')
      set({ interviews: res.data.data })
    } finally {
      set({ loading: false })
    }
  },

  createInterview: async (interview) => {
    set({ loading: true })
    try {
      await axios.post('/api/interviews', interview)
      await get().fetchInterviews()
    } finally {
      set({ loading: false })
    }
  },

  getOccupiedSlots: async (date) => {
    const res = await axios.get<ApiResponse<string[]>>(`/api/interviews/slots?date=${date}`)
    return res.data.data
  },

  createScore: async (score) => {
    set({ loading: true })
    try {
      await axios.post('/api/scores', score)
      await get().fetchResumes()
    } finally {
      set({ loading: false })
    }
  },

  fetchScoresByResume: async (resumeId) => {
    set({ loading: true })
    try {
      const res = await axios.get<ApiResponse<Score[]>>(`/api/scores/resume/${resumeId}`)
      set({ scores: res.data.data })
    } finally {
      set({ loading: false })
    }
  },
}))
