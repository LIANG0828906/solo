import axios from 'axios'
import type { Job, Resume, Interview, Score } from '@shared/types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export const api = {
  async getJobs(): Promise<Job[]> {
    const res = await axios.get<ApiResponse<Job[]>>('/api/jobs')
    return res.data.data
  },

  async createJob(job: Omit<Job, 'id' | 'createdAt'>): Promise<Job> {
    const res = await axios.post<ApiResponse<Job>>('/api/jobs', job)
    return res.data.data
  },

  async getJob(id: string): Promise<Job> {
    const res = await axios.get<ApiResponse<Job>>(`/api/jobs/${id}`)
    return res.data.data
  },

  async getResumes(): Promise<Resume[]> {
    const res = await axios.get<ApiResponse<Resume[]>>('/api/resumes')
    return res.data.data
  },

  async createResume(resume: Omit<Resume, 'id' | 'uploadedAt' | 'status' | 'scores' | 'averageScore'>): Promise<Resume> {
    const res = await axios.post<ApiResponse<Resume>>('/api/resumes', resume)
    return res.data.data
  },

  async updateResumeStatus(id: string, status: Resume['status']): Promise<Resume> {
    const res = await axios.patch<ApiResponse<Resume>>(`/api/resumes/${id}/status`, { status })
    return res.data.data
  },

  async getInterviews(): Promise<Interview[]> {
    const res = await axios.get<ApiResponse<Interview[]>>('/api/interviews')
    return res.data.data
  },

  async createInterview(interview: Omit<Interview, 'id' | 'status'>): Promise<Interview> {
    const res = await axios.post<ApiResponse<Interview>>('/api/interviews', interview)
    return res.data.data
  },

  async getOccupiedSlots(date: string): Promise<string[]> {
    const res = await axios.get<ApiResponse<string[]>>(`/api/interviews/slots?date=${date}`)
    return res.data.data
  },

  async createScore(score: Omit<Score, 'id' | 'createdAt'>): Promise<Score> {
    const res = await axios.post<ApiResponse<Score>>('/api/scores', score)
    return res.data.data
  },

  async getScoresByResume(resumeId: string): Promise<Score[]> {
    const res = await axios.get<ApiResponse<Score[]>>(`/api/scores/resume/${resumeId}`)
    return res.data.data
  },
}

export default api
