export interface Artwork {
  id: string
  title: string
  author: string
  year: number
  width: number
  height: number
  imageUrl: string
}

export type WallType = 'front' | 'back' | 'left' | 'right'

export interface PlacedArtwork {
  id: string
  artworkId: string
  wall: WallType
  positionX: number
  positionY: number
  rotation: number
  scale: number
}

export interface Exhibition {
  id: string
  userId: string
  name: string
  artworks: PlacedArtwork[]
  createdAt: string
}

export interface UserData {
  userId: string
  username: string
}

export interface DragState {
  isDragging: boolean
  artwork: Artwork | null
  screenX: number
  screenY: number
}
