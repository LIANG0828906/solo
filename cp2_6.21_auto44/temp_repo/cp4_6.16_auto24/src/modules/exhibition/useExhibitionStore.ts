import { create } from 'zustand'
import { get, set, del, keys, createStore } from 'idb-keyval'
import { v4 as uuidv4 } from 'uuid'
import imageCompression from 'browser-image-compression'
import type { Exhibition, Artwork, Comment, ColorScheme } from '../../types'
import { COLOR_SCHEMES } from '../../types'

const idbStore = createStore('artvault-db', 'artvault-store')

const EXHIBITIONS_KEY = 'exhibitions'
const ARTWORKS_KEY_PREFIX = 'artworks_'
const COMMENTS_KEY_PREFIX = 'comments_'

interface ExhibitionState {
  exhibitions: Exhibition[]
  currentExhibition: Exhibition | null
  currentArtwork: Artwork | null
  artworks: Record<string, Artwork[]>
  comments: Record<string, Comment[]>
  loading: boolean
  error: string | null

  createExhibition: (ownerId: string, ownerName: string, name: string, colorSchemeId: number) => Promise<Exhibition | null>
  deleteExhibition: (exhibitionId: string) => Promise<boolean>
  getExhibition: (exhibitionId: string) => Promise<Exhibition | null>
  fetchAllExhibitions: () => Promise<Exhibition[]>
  fetchExhibitionArtworks: (exhibitionId: string) => Promise<Artwork[]>
  setCurrentExhibition: (exhibitionId: string) => Promise<boolean>
  clearCurrentExhibition: () => void

  uploadArtwork: (
    exhibitionId: string,
    file: File,
    title: string,
    author: string,
    description: string,
    wallIndex: number
  ) => Promise<Artwork | null>
  updateArtworkPosition: (
    artworkId: string,
    position: { x: number; y: number; scale: number }
  ) => Promise<boolean>
  deleteArtwork: (artworkId: string) => Promise<boolean>
  setCurrentArtwork: (artwork: Artwork | null) => void

  fetchComments: (artworkId: string) => Promise<Comment[]>
  addComment: (artworkId: string, username: string, content: string) => Promise<Comment | null>
  likeArtwork: (artworkId: string) => Promise<boolean>
  likeComment: (commentId: string) => Promise<boolean>
}

const compressImage = async (file: File): Promise<string> => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  }
  try {
    const compressed = await imageCompression(file, options)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(compressed)
    })
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

const getLikedArtworks = (): Set<string> => {
  try {
    const stored = localStorage.getItem('artvault_liked_artworks')
    return new Set(stored ? JSON.parse(stored) : [])
  } catch {
    return new Set()
  }
}

const saveLikedArtworks = (set: Set<string>) => {
  localStorage.setItem('artvault_liked_artworks', JSON.stringify([...set]))
}

const getLikedComments = (): Set<string> => {
  try {
    const stored = localStorage.getItem('artvault_liked_comments')
    return new Set(stored ? JSON.parse(stored) : [])
  } catch {
    return new Set()
  }
}

const saveLikedComments = (set: Set<string>) => {
  localStorage.setItem('artvault_liked_comments', JSON.stringify([...set]))
}

export const useExhibitionStore = create<ExhibitionState>((set, get) => ({
  exhibitions: [],
  currentExhibition: null,
  currentArtwork: null,
  artworks: {},
  comments: {},
  loading: false,
  error: null,

  createExhibition: async (ownerId, ownerName, name, colorSchemeId) => {
    const colorScheme = COLOR_SCHEMES.find(c => c.id === colorSchemeId) || COLOR_SCHEMES[0]
    const exhibition: Exhibition = {
      id: uuidv4(),
      ownerId,
      ownerName,
      name,
      themeColor: colorScheme.primary,
      colorScheme,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    try {
      const exhibitions = (await get<Exhibition[]>(EXHIBITIONS_KEY, idbStore)) || []
      exhibitions.push(exhibition)
      await set(EXHIBITIONS_KEY, exhibitions, idbStore)
      set(state => ({
        exhibitions: [...state.exhibitions, exhibition],
      }))
      return exhibition
    } catch (e) {
      set({ error: '创建展厅失败' })
      return null
    }
  },

  deleteExhibition: async (exhibitionId) => {
    try {
      const exhibitions = (await get<Exhibition[]>(EXHIBITIONS_KEY, idbStore)) || []
      const filtered = exhibitions.filter(e => e.id !== exhibitionId)
      await set(EXHIBITIONS_KEY, filtered, idbStore)
      await del(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, idbStore)
      set(state => ({
        exhibitions: state.exhibitions.filter(e => e.id !== exhibitionId),
        currentExhibition: state.currentExhibition?.id === exhibitionId ? null : state.currentExhibition,
      }))
      return true
    } catch {
      set({ error: '删除展厅失败' })
      return false
    }
  },

  getExhibition: async (exhibitionId) => {
    const exhibitions = (await get<Exhibition[]>(EXHIBITIONS_KEY, idbStore)) || []
    return exhibitions.find(e => e.id === exhibitionId) || null
  },

  fetchAllExhibitions: async () => {
    try {
      const exhibitions = (await get<Exhibition[]>(EXHIBITIONS_KEY, idbStore)) || []
      set({ exhibitions })
      return exhibitions
    } catch {
      set({ error: '获取展厅列表失败' })
      return []
    }
  },

  fetchExhibitionArtworks: async (exhibitionId) => {
    try {
      const artworks = (await get<Artwork[]>(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, idbStore)) || []
      set(state => ({
        artworks: { ...state.artworks, [exhibitionId]: artworks },
      }))
      return artworks
    } catch {
      set({ error: '获取作品列表失败' })
      return []
    }
  },

  setCurrentExhibition: async (exhibitionId) => {
    try {
      const exhibition = await get().getExhibition(exhibitionId)
      if (!exhibition) return false
      const artworks = await get().fetchExhibitionArtworks(exhibitionId)
      set({
        currentExhibition: exhibition,
        artworks: { ...get().artworks, [exhibitionId]: artworks },
      })
      return true
    } catch {
      set({ error: '加载展厅失败' })
      return false
    }
  },

  clearCurrentExhibition: () => {
    set({ currentExhibition: null, currentArtwork: null })
  },

  uploadArtwork: async (exhibitionId, file, title, author, description, wallIndex) => {
    if (file.size > 5 * 1024 * 1024) {
      set({ error: '文件大小不能超过5MB' })
      return null
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      set({ error: '只支持JPG/PNG/WebP格式' })
      return null
    }
    try {
      const imageData = await compressImage(file)
      const existingArtworks = get().artworks[exhibitionId] || []
      const countOnWall = existingArtworks.filter(a => a.wallIndex === wallIndex).length
      const positionsPerRow = 3
      const row = Math.floor(countOnWall / positionsPerRow)
      const col = countOnWall % positionsPerRow
      const baseX = -2
      const baseY = 0.5
      const stepX = 2
      const stepY = -1.8
      const artwork: Artwork = {
        id: uuidv4(),
        exhibitionId,
        title,
        author,
        createdAt: new Date().toISOString(),
        description,
        imageData,
        position: {
          x: baseX + col * stepX,
          y: baseY + row * stepY,
          scale: 1,
        },
        wallIndex,
        likes: 0,
      }
      const allArtworks = (await get<Artwork[]>(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, idbStore)) || []
      allArtworks.push(artwork)
      await set(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, allArtworks, idbStore)
      set(state => ({
        artworks: {
          ...state.artworks,
          [exhibitionId]: allArtworks,
        },
      }))
      return artwork
    } catch (e) {
      set({ error: '上传作品失败' })
      return null
    }
  },

  updateArtworkPosition: async (artworkId, position) => {
    try {
      const state = get()
      let exhibitionId = ''
      for (const [eid, artworks] of Object.entries(state.artworks)) {
        if (artworks.some(a => a.id === artworkId)) {
          exhibitionId = eid
          break
        }
      }
      if (!exhibitionId) return false
      const allArtworks = (await get<Artwork[]>(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, idbStore)) || []
      const updated = allArtworks.map(a =>
        a.id === artworkId ? { ...a, position } : a
      )
      await set(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, updated, idbStore)
      set(state => ({
        artworks: { ...state.artworks, [exhibitionId]: updated },
      }))
      return true
    } catch {
      set({ error: '保存位置失败' })
      return false
    }
  },

  deleteArtwork: async (artworkId) => {
    try {
      const state = get()
      let exhibitionId = ''
      for (const [eid, artworks] of Object.entries(state.artworks)) {
        if (artworks.some(a => a.id === artworkId)) {
          exhibitionId = eid
          break
        }
      }
      if (!exhibitionId) return false
      const allArtworks = (await get<Artwork[]>(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, idbStore)) || []
      const filtered = allArtworks.filter(a => a.id !== artworkId)
      await set(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, filtered, idbStore)
      set(state => ({
        artworks: { ...state.artworks, [exhibitionId]: filtered },
        currentArtwork: state.currentArtwork?.id === artworkId ? null : state.currentArtwork,
      }))
      return true
    } catch {
      set({ error: '删除作品失败' })
      return false
    }
  },

  setCurrentArtwork: (artwork) => {
    set({ currentArtwork: artwork })
  },

  fetchComments: async (artworkId) => {
    try {
      const comments = (await get<Comment[]>(`${COMMENTS_KEY_PREFIX}${artworkId}`, idbStore)) || []
      comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      set(state => ({
        comments: { ...state.comments, [artworkId]: comments },
      }))
      return comments
    } catch {
      return []
    }
  },

  addComment: async (artworkId, username, content) => {
    if (content.length > 200) return null
    try {
      const comment: Comment = {
        id: uuidv4(),
        artworkId,
        username: username || '匿名访客',
        content,
        createdAt: new Date().toISOString(),
        likes: 0,
      }
      const allComments = (await get<Comment[]>(`${COMMENTS_KEY_PREFIX}${artworkId}`, idbStore)) || []
      allComments.push(comment)
      await set(`${COMMENTS_KEY_PREFIX}${artworkId}`, allComments, idbStore)
      allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      set(state => ({
        comments: { ...state.comments, [artworkId]: allComments },
      }))
      return comment
    } catch {
      set({ error: '发表留言失败' })
      return null
    }
  },

  likeArtwork: async (artworkId) => {
    try {
      const liked = getLikedArtworks()
      if (liked.has(artworkId)) return false
      liked.add(artworkId)
      saveLikedArtworks(liked)
      const state = get()
      let exhibitionId = ''
      for (const [eid, artworks] of Object.entries(state.artworks)) {
        if (artworks.some(a => a.id === artworkId)) {
          exhibitionId = eid
          break
        }
      }
      if (!exhibitionId) return false
      const allArtworks = (await get<Artwork[]>(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, idbStore)) || []
      const updated = allArtworks.map(a =>
        a.id === artworkId ? { ...a, likes: a.likes + 1 } : a
      )
      await set(`${ARTWORKS_KEY_PREFIX}${exhibitionId}`, updated, idbStore)
      set(state => ({
        artworks: { ...state.artworks, [exhibitionId]: updated },
        currentArtwork: state.currentArtwork?.id === artworkId
          ? { ...state.currentArtwork, likes: state.currentArtwork.likes + 1 }
          : state.currentArtwork,
      }))
      return true
    } catch {
      return false
    }
  },

  likeComment: async (commentId) => {
    try {
      const liked = getLikedComments()
      if (liked.has(commentId)) return false
      liked.add(commentId)
      saveLikedComments(liked)
      const state = get()
      let artworkId = ''
      for (const [aid, comments] of Object.entries(state.comments)) {
        if (comments.some(c => c.id === commentId)) {
          artworkId = aid
          break
        }
      }
      if (!artworkId) return false
      const allComments = (await get<Comment[]>(`${COMMENTS_KEY_PREFIX}${artworkId}`, idbStore)) || []
      const updated = allComments.map(c =>
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      )
      await set(`${COMMENTS_KEY_PREFIX}${artworkId}`, updated, idbStore)
      updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      set(state => ({
        comments: { ...state.comments, [artworkId]: updated },
      }))
      return true
    } catch {
      return false
    }
  },
}))
