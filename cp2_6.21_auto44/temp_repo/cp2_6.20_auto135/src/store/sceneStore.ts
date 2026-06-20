import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import * as THREE from 'three'

export type GeometryType = 'box' | 'sphere' | 'cylinder' | 'torus' | 'cone'

export interface MaterialProps {
  color: string
  roughness: number
  metalness: number
}

export interface GeometryItemData {
  id: string
  type: GeometryType
  name: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  material: MaterialProps
  visible: boolean
  animateIn: boolean
}

export interface LightsConfig {
  ambientIntensity: number
  pointPosition: { x: number; y: number; z: number }
  pointIntensity: number
}

export type TransformMode = 'translate' | 'rotate' | 'scale'

interface SceneState {
  geometries: GeometryItemData[]
  selectedId: string | null
  lights: LightsConfig
  transformMode: TransformMode
  showExportModal: boolean

  addGeometry: (type: GeometryType) => void
  removeGeometry: (id: string) => void
  updateGeometry: (id: string, updates: Partial<GeometryItemData>) => void
  selectGeometry: (id: string | null) => void
  setTransformMode: (mode: TransformMode) => void
  clearScene: () => void
  setLights: (lights: Partial<LightsConfig>) => void
  setShowExportModal: (show: boolean) => void
}

const geometryNames: Record<GeometryType, string> = {
  box: '立方体',
  sphere: '球体',
  cylinder: '圆柱',
  torus: '圆环',
  cone: '圆锥',
}

const randomColor = () => {
  const hue = Math.random() * 360
  const color = new THREE.Color().setHSL(hue / 360, 0.7, 0.55)
  return '#' + color.getHexString()
}

const defaultLights: LightsConfig = {
  ambientIntensity: 0.5,
  pointPosition: { x: 5, y: 5, z: 5 },
  pointIntensity: 1,
}

export const useSceneStore = create<SceneState>((set, get) => ({
  geometries: [],
  selectedId: null,
  lights: { ...defaultLights },
  transformMode: 'translate',
  showExportModal: false,

  addGeometry: (type) => {
    const count = get().geometries.filter((g) => g.type === type).length + 1
    const newItem: GeometryItemData = {
      id: uuidv4(),
      type,
      name: `${geometryNames[type]} ${count}`,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: {
        color: randomColor(),
        roughness: 0.5,
        metalness: 0.3,
      },
      visible: true,
      animateIn: true,
    }
    set((state) => ({
      geometries: [...state.geometries, newItem],
      selectedId: newItem.id,
    }))
    setTimeout(() => {
      set((state) => ({
        geometries: state.geometries.map((g) =>
          g.id === newItem.id ? { ...g, animateIn: false } : g
        ),
      }))
    }, 300)
  },

  removeGeometry: (id) => {
    set((state) => ({
      geometries: state.geometries.map((g) =>
        g.id === id ? { ...g, visible: false } : g
      ),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }))
    setTimeout(() => {
      set((state) => ({
        geometries: state.geometries.filter((g) => g.id !== id),
      }))
    }, 200)
  },

  updateGeometry: (id, updates) => {
    set((state) => ({
      geometries: state.geometries.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }))
  },

  selectGeometry: (id) => {
    set({ selectedId: id })
  },

  setTransformMode: (mode) => {
    set({ transformMode: mode })
  },

  clearScene: () => {
    set({
      geometries: [],
      selectedId: null,
      lights: { ...defaultLights },
    })
  },

  setLights: (lights) => {
    set((state) => ({
      lights: { ...state.lights, ...lights },
    }))
  },

  setShowExportModal: (show) => {
    set({ showExportModal: show })
  },
}))
