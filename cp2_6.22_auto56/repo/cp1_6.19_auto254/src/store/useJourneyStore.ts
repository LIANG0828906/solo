import { create } from 'zustand'
import type { Photo, JourneyState, JourneyActions } from '@/types'

const initialState: JourneyState = {
  photos: [],
  selectedPhotoId: null,
  highlightedPhotoId: null,
  isRoaming: false,
  roamingSpeed: 1,
  isAddingLocation: false,
  pendingPhotoId: null
}

export const useJourneyStore = create<JourneyState & JourneyActions>((set) => ({
  ...initialState,

  addPhotos: (photos) =>
    set((state) => {
      const sorted = [...state.photos, ...photos].sort((a, b) => {
        if (!a.timestamp && !b.timestamp) return 0
        if (!a.timestamp) return 1
        if (!b.timestamp) return -1
        return a.timestamp.getTime() - b.timestamp.getTime()
      })
      return { photos: sorted }
    }),

  removePhoto: (id) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
      selectedPhotoId: state.selectedPhotoId === id ? null : state.selectedPhotoId,
      highlightedPhotoId: state.highlightedPhotoId === id ? null : state.highlightedPhotoId
    })),

  selectPhoto: (id) => set({ selectedPhotoId: id }),
  highlightPhoto: (id) => set({ highlightedPhotoId: id }),

  setRoaming: (isRoaming) => set({ isRoaming }),
  setRoamingSpeed: (roamingSpeed) => set({ roamingSpeed }),

  updatePhotoLocation: (id, lat, lng, description) =>
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === id
          ? {
              ...p,
              lat: Number(lat.toFixed(4)),
              lng: Number(lng.toFixed(4)),
              hasGPS: true,
              locationDescription: description || p.locationDescription
            }
          : p
      ),
      isAddingLocation: false,
      pendingPhotoId: null
    })),

  startAddLocation: (photoId) =>
    set({
      isAddingLocation: true,
      pendingPhotoId: photoId
    }),

  cancelAddLocation: () =>
    set({
      isAddingLocation: false,
      pendingPhotoId: null
    }),

  clearAll: () => set(initialState)
}))
