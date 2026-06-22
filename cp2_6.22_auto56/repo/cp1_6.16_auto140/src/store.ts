import { create } from 'zustand'

export type DiseaseType = 'crack' | 'rust' | 'peeling' | 'contamination'

export type MaterialType = 'epoxy' | 'acrylate' | 'nanoCalcium'

export interface Disease {
  id: string
  type: DiseaseType
  name: string
  color: string
  position: { x: number; y: number; z: number }
  area: number
  depth: number
  repairMethod: string
}

export interface RepairParams {
  material: MaterialType
  fillLevel: number
}

export interface MaterialInfo {
  name: string
  baseColor: string
  dryTime: string
}

export const MATERIAL_INFO: Record<MaterialType, MaterialInfo> = {
  epoxy: {
    name: '环氧树脂',
    baseColor: '#D4A574',
    dryTime: '24小时'
  },
  acrylate: {
    name: '丙烯酸酯',
    baseColor: '#F5F5F5',
    dryTime: '6小时'
  },
  nanoCalcium: {
    name: '纳米钙基材料',
    baseColor: '#E8E4D9',
    dryTime: '12小时'
  }
}

export const DISEASE_COLORS: Record<DiseaseType, string> = {
  crack: '#D32F2F',
  rust: '#E65100',
  peeling: '#FBC02D',
  contamination: '#616161'
}

export const DISEASE_NAMES: Record<DiseaseType, string> = {
  crack: '裂纹',
  rust: '锈蚀',
  peeling: '剥落',
  contamination: '污染'
}

interface AppState {
  uploadedImages: string[]
  diseases: Disease[]
  highlightedDiseaseId: string | null
  repairParams: RepairParams
  modelRef: any
  actions: {
    addImage: (base64: string) => void
    setDiseases: (diseases: Disease[]) => void
    setHighlighted: (id: string | null) => void
    setRepairParams: (params: Partial<RepairParams>) => void
    setModelRef: (ref: any) => void
  }
}

export const useStore = create<AppState>((set) => ({
  uploadedImages: [],
  diseases: [],
  highlightedDiseaseId: null,
  repairParams: {
    material: 'epoxy',
    fillLevel: 50
  },
  modelRef: null,
  actions: {
    addImage: (base64) => set((state) => ({
      uploadedImages: [...state.uploadedImages, base64]
    })),
    setDiseases: (diseases) => set({ diseases }),
    setHighlighted: (id) => set({ highlightedDiseaseId: id }),
    setRepairParams: (params) => set((state) => ({
      repairParams: { ...state.repairParams, ...params }
    })),
    setModelRef: (ref) => set({ modelRef: ref })
  }
}))
