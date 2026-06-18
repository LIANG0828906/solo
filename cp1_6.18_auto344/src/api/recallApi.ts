import axios from 'axios'
import type { Recall, HeatData, SubmitRecallRequest } from '@/types'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
})

export const recallApi = {
  submitRecall: async (data: SubmitRecallRequest): Promise<Recall> => {
    const response = await api.post<Recall>('/recall', data)
    return response.data
  },

  getRecallsByLocation: async (locationId: string): Promise<Recall[]> => {
    const response = await api.get<Recall[]>(`/recall/${locationId}`)
    return response.data
  },

  getHeatmap: async (): Promise<HeatData[]> => {
    const response = await api.get<HeatData[]>('/heatmap')
    return response.data
  },
}
