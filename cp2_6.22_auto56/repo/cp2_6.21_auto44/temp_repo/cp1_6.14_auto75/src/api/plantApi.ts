import axios from 'axios'

export interface Plant {
  id: string
  name: string
  species: string
  purchaseDate: string
  location: string
  photo: string
  waterCycle: number
  fertilizeCycle: number
  lastWatered?: string
  lastFertilized?: string
  createdAt: string
}

export interface Reminder {
  id: string
  plantId: string
  plantName: string
  type: 'water' | 'fertilize'
  dueDate: string
  daysLeft: number
  completed: boolean
}

export interface CareRecord {
  id: string
  plantId: string
  type: 'water' | 'fertilize' | 'prune' | 'repot' | 'observation'
  note: string
  date: string
  time: string
}

export interface Photo {
  id: string
  plantId: string
  url: string
  date: string
  month: string
}

export interface HealthReport {
  id: string
  plantId: string
  score: number
  suggestions: string[]
  date: string
  answers: number[]
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const fetchPlants = async (): Promise<Plant[]> => {
  const { data } = await api.get('/plants')
  return data
}

export const getPlant = async (id: string): Promise<Plant> => {
  const { data } = await api.get(`/plants/${id}`)
  return data
}

export const addPlant = async (plantData: FormData): Promise<Plant> => {
  const { data } = await api.post('/plants', plantData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export const updatePlant = async (id: string, plantData: Partial<Plant>): Promise<Plant> => {
  const { data } = await api.put(`/plants/${id}`, plantData)
  return data
}

export const deletePlant = async (id: string): Promise<void> => {
  await api.delete(`/plants/${id}`)
}

export const getReminders = async (): Promise<Reminder[]> => {
  const { data } = await api.get('/reminders')
  return data
}

export const completeReminder = async (id: string): Promise<void> => {
  await api.post(`/reminders/${id}/complete`)
}

export const getCareRecords = async (plantId: string): Promise<CareRecord[]> => {
  const { data } = await api.get(`/plants/${plantId}/records`)
  return data
}

export const addCareRecord = async (plantId: string, record: Omit<CareRecord, 'id' | 'plantId'>): Promise<CareRecord> => {
  const { data } = await api.post(`/plants/${plantId}/records`, record)
  return data
}

export const getPhotos = async (plantId: string): Promise<Photo[]> => {
  const { data } = await api.get(`/plants/${plantId}/photos`)
  return data
}

export const addPhoto = async (plantId: string, formData: FormData): Promise<Photo> => {
  const { data } = await api.post(`/plants/${plantId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export const downloadPhotos = async (photoIds: string[], plantName: string): Promise<Blob> => {
  const { data } = await api.post('/photos/download', { photoIds }, {
    responseType: 'blob'
  })
  return data
}

export const checkHealth = async (plantId: string, answers: number[]): Promise<HealthReport> => {
  const { data } = await api.post(`/plants/${plantId}/health`, { answers })
  return data
}

export const getHealthReports = async (plantId: string): Promise<HealthReport[]> => {
  const { data } = await api.get(`/plants/${plantId}/health`)
  return data
}
