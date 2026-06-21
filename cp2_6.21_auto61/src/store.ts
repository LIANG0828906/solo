import { create } from 'zustand'
import * as THREE from 'three'

export type ArtifactType = 'blue-porcelain' | 'bronze'

export interface FragmentData {
  id: number
  correctOrder: number
  initialPosition: THREE.Vector3
  initialRotation: THREE.Euler
  correctPosition: THREE.Vector3
  correctRotation: THREE.Euler
  isFused: boolean
  fusePartner: number | null
}

export interface ArtifactInfo {
  name: string
  dynasty: string
  year: string
  discovery: string
  description: string
}

interface StoreState {
  fragments: FragmentData[]
  fusedFragmentIds: Set<number>
  selectedFragmentId: number | null
  progress: number
  isComplete: boolean
  artifactType: ArtifactType
  artifactInfo: ArtifactInfo
  fuseSequence: number[]
  snapHighlightIds: Set<number>

  initFragments: () => void
  selectFragment: (id: number | null) => void
  fuseFragment: (id: number) => void
  updateFragmentTransform: (id: number, position: THREE.Vector3, rotation: THREE.Euler) => void
  setSnapHighlight: (ids: Set<number>) => void
  setComplete: () => void
  reset: () => void
}

const PORCELAIN_INFO: ArtifactInfo = {
  name: '青花缠枝莲纹梅瓶',
  dynasty: '明代',
  year: '永乐年间 (1403-1424)',
  discovery: '1964年出土于江苏省南京市明故宫遗址',
  description: '此瓶通体绘青花缠枝莲纹，釉色温润如玉，青花发色浓艳，为明代永乐官窑青花瓷之精品。器型端庄秀丽，线条流畅自然，代表了中国古代青花瓷烧制技艺的巅峰水平。'
}

function generateFragments(): FragmentData[] {
  const count = 10
  const fragments: FragmentData[] = []
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const radius = 3.5
    const offsetY = (Math.random() - 0.5) * 2
    const offsetX = (Math.random() - 0.5) * 1.5
    const offsetZ = (Math.random() - 0.5) * 1.5
    
    const yPos = (i / (count - 1)) * 3 - 1.5
    const xPos = Math.cos(angle) * 0.3
    const zPos = Math.sin(angle) * 0.3
    
    fragments.push({
      id: i,
      correctOrder: i,
      initialPosition: new THREE.Vector3(
        Math.cos(angle) * radius + offsetX,
        offsetY,
        Math.sin(angle) * radius + offsetZ
      ),
      initialRotation: new THREE.Euler(
        (Math.random() - 0.5) * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.5
      ),
      correctPosition: new THREE.Vector3(xPos, yPos, zPos),
      correctRotation: new THREE.Euler(0, 0, 0),
      isFused: false,
      fusePartner: null
    })
  }
  
  return fragments
}

export const useStore = create<StoreState>((set, get) => ({
  fragments: [],
  fusedFragmentIds: new Set(),
  selectedFragmentId: null,
  progress: 0,
  isComplete: false,
  artifactType: 'blue-porcelain',
  artifactInfo: PORCELAIN_INFO,
  fuseSequence: [],
  snapHighlightIds: new Set(),

  initFragments: () => {
    const fragments = generateFragments()
    set({
      fragments,
      fusedFragmentIds: new Set(),
      selectedFragmentId: null,
      progress: 0,
      isComplete: false,
      fuseSequence: [],
      snapHighlightIds: new Set()
    })
  },

  selectFragment: (id) => {
    set({ selectedFragmentId: id })
  },

  fuseFragment: (id) => {
    const state = get()
    if (state.fusedFragmentIds.has(id)) return

    const newFusedIds = new Set(state.fusedFragmentIds)
    newFusedIds.add(id)
    
    const newFragments = state.fragments.map(f =>
      f.id === id ? { ...f, isFused: true } : f
    )

    const newSequence = [...state.fuseSequence, id]
    const progress = Math.round((newFusedIds.size / state.fragments.length) * 100)
    const isComplete = newFusedIds.size >= state.fragments.length

    set({
      fragments: newFragments,
      fusedFragmentIds: newFusedIds,
      fuseSequence: newSequence,
      progress,
      isComplete
    })
  },

  updateFragmentTransform: (id, position, rotation) => {
    const state = get()
    const newFragments = state.fragments.map(f =>
      f.id === id ? {
        ...f,
        initialPosition: position.clone(),
        initialRotation: rotation.clone()
      } : f
    )
    set({ fragments: newFragments })
  },

  setSnapHighlight: (ids) => {
    set({ snapHighlightIds: ids })
  },

  setComplete: () => {
    set({ isComplete: true, progress: 100 })
  },

  reset: () => {
    get().initFragments()
  }
}))
