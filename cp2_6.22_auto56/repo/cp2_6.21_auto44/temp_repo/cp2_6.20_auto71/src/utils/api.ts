import axios from 'axios'

export type ElementType = 'metal' | 'wood' | 'water' | 'fire' | 'earth'

export type ArtifactType = 'sword' | 'ding' | 'banner' | 'pearl' | 'mirror' | 'talisman'

export interface VeinNodeState {
  id: string
  name: string
  symbol: string
  color: string
  isActive: boolean
  energy: number
  energyBalance: Record<ElementType, number>
}

export interface BaseArtifact {
  id: string
  name: string
  type: ArtifactType
  icon: string
  baseElement: ElementType
  baseStats: { attack: number; defense: number; speed: number }
}

export interface SmeltedArtifact extends BaseArtifact {
  smeltedId: string
  soulHoles: (ElementType | null)[]
  finalStats: { attack: number; defense: number; speed: number }
  mainElement: ElementType
  bonuses: Record<string, number>
  smeltedAt: string
  resonationBoost: number
}

export interface ResonationResult {
  chainLength: number
  isBurst: boolean
  totalEnergyOutput: number
  burstNodes: ElementType[]
  boostPercent: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  isUnlocked: boolean
  unlockedAt?: string
  conditions: { type: string; target: number; current: number }
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message ?? error.message ?? 'Unknown API error'
    return Promise.reject(new Error(message))
  },
)

export async function activateVeinNode(
  nodeId: ElementType,
  currentStates: VeinNodeState[],
): Promise<VeinNodeState[]> {
  return api.post('/vein/activate', { nodeId, currentStates })
}

export async function calculateArtifactStats(
  artifactId: string,
  soulHoles: (ElementType | null)[],
  resonationBoost: number,
): Promise<{ mainElement: ElementType; finalStats: { attack: number; defense: number; speed: number }; bonuses: Record<string, number> }> {
  return api.post('/artifact/calculate', { artifactId, soulHoles, resonationBoost })
}

export async function getArtifacts(): Promise<BaseArtifact[]> {
  return api.get('/artifacts')
}

export async function getArtifact(id: string): Promise<BaseArtifact> {
  return api.get(`/artifacts/${id}`)
}

export async function saveSmeltedArtifact(artifact: SmeltedArtifact): Promise<SmeltedArtifact> {
  return api.post('/smelt/save', artifact)
}

export async function getCollection(): Promise<SmeltedArtifact[]> {
  return api.get('/collection')
}

export async function getAchievements(): Promise<Achievement[]> {
  return api.get('/achievements')
}

export async function checkAchievements(
  collection: SmeltedArtifact[],
  resonationCount: number,
): Promise<Achievement[]> {
  return api.post('/achievements/check', { collection, resonationCount })
}
