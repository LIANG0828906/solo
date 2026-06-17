import { v4 as uuidv4 } from 'uuid'

export type BeamType = 'point' | 'spot' | 'rotating'

export interface BeamPosition {
  gridX: number
  gridY: number
}

export interface IBeam {
  id: string
  type: BeamType
  gridX: number
  gridY: number
  hue: number
  brightness: number
  rotationSpeed: number
  order: number
}

export interface CreateBeamOptions {
  type: BeamType
  gridX: number
  gridY: number
  hue?: number
  brightness?: number
  rotationSpeed?: number
  order?: number
}

export const createBeam = (options: CreateBeamOptions): IBeam => {
  const {
    type,
    gridX,
    gridY,
    hue = 200,
    brightness = 80,
    rotationSpeed = type === 'rotating' ? 2 : 0,
    order = 0,
  } = options

  return {
    id: uuidv4(),
    type,
    gridX,
    gridY,
    hue: Math.max(0, Math.min(360, hue)),
    brightness: Math.max(10, Math.min(100, brightness)),
    rotationSpeed: Math.max(0, Math.min(10, rotationSpeed)),
    order,
  }
}

export const cloneBeam = (beam: IBeam): IBeam => ({
  ...beam,
  id: uuidv4(),
})

export const GRID_COLS = 5
export const GRID_ROWS = 7
export const MAX_BEAMS = 30
