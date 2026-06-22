import axios from 'axios'
import type { CharacterId } from '@/types/game'

const api = axios.create({ baseURL: '/api' })

export async function fetchCharacter(id: CharacterId) {
  const res = await api.get(`/character/${id}`)
  return res.data.data
}

export async function fetchAllCharacters() {
  const res = await api.get('/character')
  return res.data.data
}

export async function updateCharacter(
  id: CharacterId,
  updates: { hp?: number; activeSkill?: string; switchTriggered?: boolean }
) {
  const res = await api.put(`/character/${id}`, updates)
  return res.data.data
}

export async function saveComboRecord(comboCount: number, levelId: string, timestamp: number) {
  const res = await api.post('/rhythm/combo', { comboCount, levelId, timestamp })
  return res.data.data
}

export async function fetchHealthTimeline(levelId: string) {
  const res = await api.get(`/rhythm/health-timeline/${levelId}`)
  return res.data.data
}

export async function saveHealthTimeline(levelId: string, timeline: unknown[]) {
  const res = await api.post('/rhythm/health-timeline', { levelId, timeline })
  return res.data.data
}

export async function fetchLevelProgress(levelId: string) {
  const res = await api.get(`/rhythm/progress/${levelId}`)
  return res.data.data
}

export async function updateLevelProgress(
  levelId: string,
  updates: { currentWave?: number; enemiesRemaining?: number; comboRecord?: number }
) {
  const res = await api.put(`/rhythm/progress/${levelId}`, updates)
  return res.data.data
}
