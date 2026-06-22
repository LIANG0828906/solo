import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type GeometryType = 'box' | 'sphere' | 'cylinder' | 'torus' | 'cone'
export type MaterialType = 'diffuse' | 'metal' | 'glossy' | 'transparent'

export interface MaterialParams {
  type: MaterialType
  color: string
  envIntensity: number
  roughness?: number
  metalness?: number
  specularIntensity?: number
  specularSharpness?: number
  opacity?: number
  ior?: number
}

export interface GeometryItem {
  id: string
  type: GeometryType
  name: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  material: MaterialParams
}

export interface PointLightItem {
  id: string
  position: [number, number, number]
  color: string
  intensity: number
  decay: number
}

export interface SceneSnapshot {
  version: number
  timestamp: number
  geometries: GeometryItem[]
  lights: {
    ambient: { intensity: number }
    directional: { intensity: number; direction: [number, number, number] }
    pointLights: PointLightItem[]
  }
}

function getDefaultMaterial(type: MaterialType): MaterialParams {
  const base: MaterialParams = {
    type,
    color: '#4A90D9',
    envIntensity: 0.5,
  }
  switch (type) {
    case 'metal':
      return { ...base, roughness: 0.3, metalness: 0.8 }
    case 'glossy':
      return { ...base, specularIntensity: 1.0, specularSharpness: 0.5 }
    case 'transparent':
      return { ...base, opacity: 0.7, ior: 1.5 }
    default:
      return base
  }
}

const geometryNames: Record<GeometryType, string> = {
  box: '立方体',
  sphere: '球体',
  cylinder: '圆柱',
  torus: '圆环',
  cone: '圆锥',
}

interface EditorStore {
  geometryList: GeometryItem[]
  lightList: PointLightItem[]
  selectedId: string | null
  transformMode: 'translate' | 'rotate'
  ambientIntensity: number
  directionalIntensity: number
  directionalDirection: [number, number, number]
  geometryCounter: Record<GeometryType, number>

  addGeometry: (type: GeometryType) => void
  removeGeometry: (id: string) => void
  selectGeometry: (id: string | null) => void
  updateTransform: (id: string, updates: Partial<Pick<GeometryItem, 'position' | 'rotation' | 'scale'>>) => void
  updateMaterial: (id: string, updates: Partial<MaterialParams>) => void
  setMaterialType: (id: string, type: MaterialType) => void
  setTransformMode: (mode: 'translate' | 'rotate') => void

  addPointLight: () => void
  updatePointLight: (id: string, updates: Partial<PointLightItem>) => void
  removePointLight: (id: string) => void

  saveSnapshot: () => SceneSnapshot
  loadSnapshot: (snapshot: SceneSnapshot) => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  geometryList: [],
  lightList: [],
  selectedId: null,
  transformMode: 'translate',
  ambientIntensity: 0.3,
  directionalIntensity: 1.0,
  directionalDirection: [5, 10, 7],
  geometryCounter: { box: 0, sphere: 0, cylinder: 0, torus: 0, cone: 0 },

  addGeometry: (type) => {
    const counter = get().geometryCounter[type] + 1
    const id = uuidv4()
    const newItem: GeometryItem = {
      id,
      type,
      name: `${geometryNames[type]} ${counter}`,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      material: getDefaultMaterial('diffuse'),
    }
    set((state) => ({
      geometryList: [...state.geometryList, newItem],
      selectedId: id,
      geometryCounter: { ...state.geometryCounter, [type]: counter },
    }))
  },

  removeGeometry: (id) => {
    set((state) => ({
      geometryList: state.geometryList.filter((g) => g.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }))
  },

  selectGeometry: (id) => {
    set({ selectedId: id })
  },

  updateTransform: (id, updates) => {
    set((state) => ({
      geometryList: state.geometryList.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }))
  },

  updateMaterial: (id, updates) => {
    set((state) => ({
      geometryList: state.geometryList.map((g) =>
        g.id === id ? { ...g, material: { ...g.material, ...updates } } : g
      ),
    }))
  },

  setMaterialType: (id, type) => {
    const newMaterial = getDefaultMaterial(type)
    set((state) => ({
      geometryList: state.geometryList.map((g) =>
        g.id === id ? { ...g, material: newMaterial } : g
      ),
    }))
  },

  setTransformMode: (mode) => {
    set({ transformMode: mode })
  },

  addPointLight: () => {
    if (get().lightList.length >= 3) return
    const id = uuidv4()
    const light: PointLightItem = {
      id,
      position: [
        (Math.random() - 0.5) * 6,
        3 + Math.random() * 2,
        (Math.random() - 0.5) * 6,
      ],
      color: '#ffffff',
      intensity: 1.0,
      decay: 1.0,
    }
    set((state) => ({ lightList: [...state.lightList, light] }))
  },

  updatePointLight: (id, updates) => {
    set((state) => ({
      lightList: state.lightList.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }))
  },

  removePointLight: (id) => {
    set((state) => ({
      lightList: state.lightList.filter((l) => l.id !== id),
    }))
  },

  saveSnapshot: () => {
    const state = get()
    return {
      version: 1,
      timestamp: Date.now(),
      geometries: JSON.parse(JSON.stringify(state.geometryList)),
      lights: {
        ambient: { intensity: state.ambientIntensity },
        directional: {
          intensity: state.directionalIntensity,
          direction: [...state.directionalDirection] as [number, number, number],
        },
        pointLights: JSON.parse(JSON.stringify(state.lightList)),
      },
    }
  },

  loadSnapshot: (snapshot) => {
    set({
      geometryList: snapshot.geometries,
      lightList: snapshot.lights.pointLights,
      selectedId: null,
      ambientIntensity: snapshot.lights.ambient.intensity,
      directionalIntensity: snapshot.lights.directional.intensity,
      directionalDirection: snapshot.lights.directional.direction,
    })
  },
}))
