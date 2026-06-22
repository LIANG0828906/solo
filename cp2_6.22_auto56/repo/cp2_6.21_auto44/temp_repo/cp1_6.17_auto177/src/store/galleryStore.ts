import { create } from 'zustand'
import type { Artwork } from '../types'
import { galleryManager } from '../GalleryManager'

interface GalleryState {
  artworks: Artwork[]
  currentId: string | null
  commentPanelId: string | null
  refresh: () => void
  setCurrentId: (id: string | null) => void
  openCommentPanel: (id: string) => void
  closeCommentPanel: () => void
  like: (id: string) => void
  addComment: (id: string, content: string) => void
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  artworks: galleryManager.getAll(),
  currentId: null,
  commentPanelId: null,
  refresh: () => set({ artworks: galleryManager.getAll() }),
  setCurrentId: (id) => set({ currentId: id }),
  openCommentPanel: (id) => set({ commentPanelId: id }),
  closeCommentPanel: () => set({ commentPanelId: null }),
  like: (id) => {
    galleryManager.like(id)
    get().refresh()
  },
  addComment: (id, content) => {
    const avatars = ['🙂', '🎨', '✨', '🌸', '🌿', '☁️', '🍂']
    const avatar = avatars[Math.floor(Math.random() * avatars.length)]
    galleryManager.addComment(id, content, '访客', avatar)
    get().refresh()
  },
}))
