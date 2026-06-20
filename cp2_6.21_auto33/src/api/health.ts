import client from './client'

export interface HealthRecord {
  id?: number
  user_id: number
  date: string
  weight: number
  steps: number
  sleep_hours: number
  water_cups: number
}

export interface Goal {
  id?: number
  user_id: number
  target_weight: number
  target_steps: number
  target_sleep: number
  target_water: number
}

export interface WeekTrendItem {
  date: string
  weight: number
  steps: number
  sleep_hours: number
  water_cups: number
}

export const submitRecord = async (record: HealthRecord): Promise<HealthRecord> => {
  const response = await client.post('/health/record', record)
  return response.data
}

export const getTodayRecord = async (userId: number): Promise<HealthRecord | null> => {
  const response = await client.get(`/health/today?user_id=${userId}`)
  return response.data
}

export const getWeekTrend = async (userId: number): Promise<WeekTrendItem[]> => {
  const response = await client.get(`/health/week?user_id=${userId}`)
  return response.data
}

export const getGoal = async (userId: number): Promise<Goal> => {
  const response = await client.get(`/health/goal?user_id=${userId}`)
  return response.data
}

export const updateGoal = async (goal: Goal): Promise<Goal> => {
  const response = await client.put('/health/goal', goal)
  return response.data
}
