export type FrameColor = 'gold' | 'black' | 'white'

export type WallMaterial = 'white' | 'brick' | 'wood' | 'marble'

export type LightPreset = 'warm' | 'cool' | 'spot' | 'natural'

export interface PaintingData {
  id: string
  imageUrl: string
  position: { x: number; y: number }
  scale: number
  rotationY: number
  frameColor: FrameColor
  aspectRatio: number
}

export interface HistoryState {
  paintings: PaintingData[]
  wallMaterial: WallMaterial
  lightPreset: LightPreset
}

export interface ScenePainting {
  id: string
  group: THREE.Group
  frameColor: FrameColor
  aspectRatio: number
  pulseMaterial?: THREE.MeshBasicMaterial
}
