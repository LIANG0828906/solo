import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const getObjectives = async () => {
  const res = await api.get('/objectives')
  return res.data
}

export const createObjective = async (data: any) => {
  const res = await api.post('/objectives', data)
  return res.data
}

export const updateObjective = async (id: string, data: any) => {
  const res = await api.put(`/objectives/${id}`, data)
  return res.data
}

export const deleteObjective = async (id: string) => {
  const res = await api.delete(`/objectives/${id}`)
  return res.data
}

export const moveObjective = async (id: string, parentId: string | null) => {
  const res = await api.put(`/objectives/${id}/move`, { parentId })
  return res.data
}

export const getMilestones = async () => {
  const res = await api.get('/milestones')
  return res.data
}

export const updateMilestone = async (id: string, data: any) => {
  const res = await api.put(`/milestones/${id}`, data)
  return res.data
}
