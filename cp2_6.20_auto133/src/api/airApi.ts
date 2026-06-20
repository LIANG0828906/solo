import axios from 'axios'
import type { City, AirQualityCurrent, AirQualityHistory } from '@/stores/airStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 1000,
})

export const airApi = {
  async getCities(): Promise<{ cities: City[] }> {
    const { data } = await api.get('/cities')
    return data
  },

  async getCurrent(cityId: string): Promise<AirQualityCurrent> {
    const { data } = await api.get(`/current/${cityId}`)
    return data
  },

  async getAllCurrent(): Promise<{ data: AirQualityCurrent[] }> {
    const { data } = await api.get('/current')
    return data
  },

  async getHistory(cityId: string): Promise<AirQualityHistory> {
    const { data } = await api.get(`/history/${cityId}`)
    return data
  },
}
