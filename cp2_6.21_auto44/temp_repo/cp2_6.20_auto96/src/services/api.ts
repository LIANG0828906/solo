import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

export interface Flower {
  id: string
  name: string
  category: string
  color: string
  color_hex: string
  shape: string
  height: number
  seasons: string[]
  meaning: string
  image: string
  pairings: string[]
}

export interface PairingFlower {
  id: string
  name: string
  color_hex: string
  image: string
}

export interface RecommendationScheme {
  scheme_id: string
  flowers: Flower[]
  score: number
  reason: string
}

export interface ScoreResult {
  score: number
  stars: number
  percentage: number
}

export const flowerApi = {
  getFlowers: async (category?: string): Promise<{ count: number; flowers: Flower[] }> => {
    const params = category ? { category } : {}
    const response = await api.get('/flowers', { params })
    return response.data
  },

  getFlower: async (flowerId: string): Promise<Flower> => {
    const response = await api.get(`/flowers/${flowerId}`)
    return response.data
  },

  getFlowerPairings: async (flowerId: string): Promise<{ flower_id: string; pairings: PairingFlower[] }> => {
    const response = await api.get(`/flowers/${flowerId}/pairings`)
    return response.data
  },

  getRecommendations: async (currentFlowerIds: string[], numSuggestions = 3): Promise<RecommendationScheme[]> => {
    const response = await api.post('/recommendation', {
      current_flower_ids: currentFlowerIds,
      num_suggestions: numSuggestions,
    })
    return response.data
  },

  calculateScore: async (currentFlowerIds: string[]): Promise<ScoreResult> => {
    const response = await api.post('/score', {
      current_flower_ids: currentFlowerIds,
    })
    return response.data
  },
}
