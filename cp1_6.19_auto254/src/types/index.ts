export interface Photo {
  id: string
  file: File
  url: string
  thumbnailUrl: string
  lat?: number
  lng?: number
  timestamp: Date | null
  locationDescription?: string
  hasGPS: boolean
}

export interface JourneyState {
  photos: Photo[]
  selectedPhotoId: string | null
  highlightedPhotoId: string | null
  isRoaming: boolean
  roamingSpeed: 0.5 | 1 | 2
  isAddingLocation: boolean
  pendingPhotoId: string | null
}

export interface JourneyActions {
  addPhotos: (photos: Photo[]) => void
  removePhoto: (id: string) => void
  selectPhoto: (id: string | null) => void
  highlightPhoto: (id: string | null) => void
  setRoaming: (isRoaming: boolean) => void
  setRoamingSpeed: (speed: 0.5 | 1 | 2) => void
  updatePhotoLocation: (id: string, lat: number, lng: number, description?: string) => void
  startAddLocation: (photoId: string) => void
  cancelAddLocation: () => void
  clearAll: () => void
}
