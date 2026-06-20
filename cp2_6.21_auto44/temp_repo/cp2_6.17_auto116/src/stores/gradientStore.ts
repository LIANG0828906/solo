import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { generateRandomColor } from '../utils/colorUtils'

export interface ColorStop {
  id: string
  color: string
  position: number
  opacity: number
}

export type GradientType = 'linear' | 'radial'
export type RadialShape = 'circle' | 'ellipse'

export interface PresetGradient {
  name: string
  type: GradientType
  colorStops: ColorStop[]
  angle: number
  bgStartColor: string
}

export const PRESETS: PresetGradient[] = [
  {
    name: 'Sunset',
    type: 'linear',
    colorStops: [
      { id: uuidv4(), color: '#FF6B6B', position: 0, opacity: 1 },
      { id: uuidv4(), color: '#FFE66D', position: 50, opacity: 1 },
      { id: uuidv4(), color: '#4ECDC4', position: 100, opacity: 1 },
    ],
    angle: 135,
    bgStartColor: '#FF6B6B',
  },
  {
    name: 'Ocean',
    type: 'linear',
    colorStops: [
      { id: uuidv4(), color: '#667EEA', position: 0, opacity: 1 },
      { id: uuidv4(), color: '#764BA2', position: 100, opacity: 1 },
    ],
    angle: 180,
    bgStartColor: '#667EEA',
  },
  {
    name: 'Forest',
    type: 'linear',
    colorStops: [
      { id: uuidv4(), color: '#134E5E', position: 0, opacity: 1 },
      { id: uuidv4(), color: '#71B280', position: 100, opacity: 1 },
    ],
    angle: 90,
    bgStartColor: '#134E5E',
  },
  {
    name: 'Fire',
    type: 'radial',
    colorStops: [
      { id: uuidv4(), color: '#F12711', position: 0, opacity: 1 },
      { id: uuidv4(), color: '#F5AF19', position: 100, opacity: 1 },
    ],
    angle: 0,
    bgStartColor: '#F12711',
  },
]

const createDefaultStops = (): ColorStop[] => [
  { id: uuidv4(), color: '#667EEA', position: 0, opacity: 1 },
  { id: uuidv4(), color: '#764BA2', position: 100, opacity: 1 },
]

interface GradientState {
  colorStops: ColorStop[]
  gradientType: GradientType
  angle: number
  radialShape: RadialShape
  ellipseScaleX: number
  ellipseScaleY: number

  updateColorStop: (id: string, updates: Partial<ColorStop>) => void
  addColorStop: (position?: number, color?: string) => void
  removeColorStop: (id: string) => void
  setGradientType: (type: GradientType) => void
  setAngle: (angle: number) => void
  setRadialShape: (shape: RadialShape) => void
  setEllipseScaleX: (scale: number) => void
  setEllipseScaleY: (scale: number) => void
  applyPreset: (preset: PresetGradient) => void
  reset: () => void
}

export const useGradientStore = create<GradientState>((set) => ({
  colorStops: createDefaultStops(),
  gradientType: 'linear',
  angle: 0,
  radialShape: 'circle',
  ellipseScaleX: 1,
  ellipseScaleY: 1,

  updateColorStop: (id, updates) =>
    set((state) => ({
      colorStops: state.colorStops.map((stop) =>
        stop.id === id ? { ...stop, ...updates } : stop
      ),
    })),

  addColorStop: (position, color) =>
    set((state) => {
      const newPosition = position !== undefined ? position : 50
      const newColor = color || generateRandomColor()
      const newStop: ColorStop = {
        id: uuidv4(),
        color: newColor,
        position: newPosition,
        opacity: 1,
      }
      return {
        colorStops: [...state.colorStops, newStop].sort(
          (a, b) => a.position - b.position
        ),
      }
    }),

  removeColorStop: (id) =>
    set((state) => ({
      colorStops: state.colorStops.filter((stop) => stop.id !== id),
    })),

  setGradientType: (type) => set({ gradientType: type }),

  setAngle: (angle) => set({ angle }),

  setRadialShape: (shape) => set({ radialShape: shape }),

  setEllipseScaleX: (scale) => set({ ellipseScaleX: scale }),

  setEllipseScaleY: (scale) => set({ ellipseScaleY: scale }),

  applyPreset: (preset) =>
    set({
      colorStops: preset.colorStops.map((s) => ({ ...s, id: uuidv4() })),
      gradientType: preset.type,
      angle: preset.angle,
    }),

  reset: () =>
    set({
      colorStops: createDefaultStops(),
      gradientType: 'linear',
      angle: 0,
      radialShape: 'circle',
      ellipseScaleX: 1,
      ellipseScaleY: 1,
    }),
}))

export function generateGradientCSS(
  colorStops: ColorStop[],
  type: GradientType,
  angle: number,
  radialShape: RadialShape,
  scaleX: number,
  scaleY: number
): string {
  const stops = [...colorStops]
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.color} ${stop.position.toFixed(1)}%`)
    .join(', ')

  if (type === 'linear') {
    return `background: linear-gradient(${angle}deg, ${stops});`
  } else {
    if (radialShape === 'circle') {
      return `background: radial-gradient(circle, ${stops});`
    } else {
      const sizeX = (scaleX * 50).toFixed(1)
      const sizeY = (scaleY * 50).toFixed(1)
      return `background: radial-gradient(ellipse ${sizeX}% ${sizeY}% at center, ${stops});`
    }
  }
}
