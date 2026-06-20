import { create } from 'zustand'

export type GeometryType = 'cube' | 'sphere' | 'cone' | 'torus'
export type MaterialType = 'metal' | 'glass' | 'matte'

export interface GeometryObject {
  id: string
  type: GeometryType
  material: MaterialType
  posX: number
  posY: number
  posZ: number
  rotX: number
  rotY: number
  rotZ: number
  scale: number
  opacity: number
}

export interface LightParams {
  mainLightAngle: number
  mainLightIntensity: number
  fillLightIntensity: number
  ambientIntensity: number
}

interface SceneState {
  geometries: GeometryObject[]
  selectedId: string | null
  lightParams: LightParams
  toolbarCollapsed: boolean
  mobileToolbarOpen: boolean
  mobilePropertyOpen: boolean
  isMobile: boolean

  addGeometry: (type: GeometryType, material: MaterialType) => string
  removeGeometry: (id: string) => void
  selectGeometry: (id: string | null) => void
  updateGeometry: (id: string, props: Partial<GeometryObject>) => void
  updateLightParams: (params: Partial<LightParams>) => void
  setToolbarCollapsed: (collapsed: boolean) => void
  setMobileToolbarOpen: (open: boolean) => void
  setMobilePropertyOpen: (open: boolean) => void
  setIsMobile: (mobile: boolean) => void
}

let idCounter = 0
const generateId = () => `geo_${++idCounter}_${Date.now()}`

const GRID_SIZE = 1

const snapToGrid = (v: number): number =>
  Math.round(v / GRID_SIZE) * GRID_SIZE

export const useSceneStore = create<SceneState>((set) => ({
  geometries: [],
  selectedId: null,
  lightParams: {
    mainLightAngle: 45,
    mainLightIntensity: 2.0,
    fillLightIntensity: 0.8,
    ambientIntensity: 0.3,
  },
  toolbarCollapsed: false,
  mobileToolbarOpen: false,
  mobilePropertyOpen: false,
  isMobile: false,

  addGeometry: (type, material) => {
    const id = generateId()
    const newGeo: GeometryObject = {
      id,
      type,
      material,
      posX: snapToGrid((Math.random() - 0.5) * 6),
      posY: 0.5,
      posZ: snapToGrid((Math.random() - 0.5) * 6),
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scale: 1,
      opacity: 0,
    }
    set((state) => ({
      geometries: [...state.geometries, newGeo],
      selectedId: id,
    }))

    requestAnimationFrame(() => {
      setTimeout(() => {
        set((state) => ({
          geometries: state.geometries.map((g) =>
            g.id === id ? { ...g, opacity: 1 } : g
          ),
        }))
      }, 16)
    })

    return id
  },

  removeGeometry: (id) =>
    set((state) => ({
      geometries: state.geometries.filter((g) => g.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  selectGeometry: (id) => set({ selectedId: id }),

  updateGeometry: (id, props) =>
    set((state) => ({
      geometries: state.geometries.map((g) =>
        g.id === id ? { ...g, ...props } : g
      ),
    })),

  updateLightParams: (params) =>
    set((state) => ({
      lightParams: { ...state.lightParams, ...params },
    })),

  setToolbarCollapsed: (collapsed) => set({ toolbarCollapsed: collapsed }),
  setMobileToolbarOpen: (open) => set({ mobileToolbarOpen: open }),
  setMobilePropertyOpen: (open) => set({ mobilePropertyOpen: open }),
  setIsMobile: (mobile) => set({ isMobile: mobile }),
}))
