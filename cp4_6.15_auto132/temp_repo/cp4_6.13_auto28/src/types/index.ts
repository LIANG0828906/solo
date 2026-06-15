export type StyleId = 'modern' | 'nordic' | 'industrial'

export type AreaId =
  | 'floor'
  | 'wall_north'
  | 'wall_south'
  | 'wall_east'
  | 'wall_west'

export interface MaterialPreset {
  id: string
  name: string
  category: 'floor' | 'wall' | 'furniture'
  color: string
  roughness: number
  metalness: number
  thumbnail: string
}

export interface StylePreset {
  id: StyleId
  name: string
  description: string
  lighting: {
    ambientIntensity: number
    directionalIntensity: number
    ambientColor: string
    directionalColor: string
  }
  materials: {
    floor: string
    walls: { north: string; south: string; east: string; west: string }
    sofa: string
    table: string
  }
}

export interface HistoryStep {
  area: AreaId
  prevMaterialId: string
  newMaterialId: string
}

export interface CameraView {
  id: 'top' | 'firstPerson'
  position: [number, number, number]
  target: [number, number, number]
}
