import { create } from 'zustand'
import type { DocState, User, Annotation, Snapshot, Document } from '../types'

const getInitialToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

const getInitialUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

export const useDocStore = create<DocState>((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthenticated: !!getInitialToken(),
  documentId: null,
  content: '',
  paragraphs: [],
  annotations: [],
  snapshots: [],
  currentSnapshotIndex: -1,
  isFading: false,

  setUser: (user: User, token: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  setDocument: (doc: Document) => {
    set({
      documentId: doc.id,
      content: doc.content,
      paragraphs: doc.paragraphs,
    })
  },

  addAnnotation: (annotation: Annotation) => {
    set((state) => ({
      annotations: [...state.annotations, annotation],
    }))
  },

  updateAnnotations: (annotations: Annotation[]) => {
    set({ annotations })
  },

  deleteAnnotation: (annotationId: string) => {
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== annotationId),
    }))
  },

  clearParagraphAnnotations: (paragraphIndex: number) => {
    set((state) => ({
      annotations: state.annotations.filter((a) => a.paragraphIndex !== paragraphIndex),
    }))
  },

  setSnapshots: (snapshots: Snapshot[]) => {
    set({
      snapshots,
      currentSnapshotIndex: snapshots.length > 0 ? snapshots.length - 1 : -1,
    })
  },

  rollbackToSnapshot: (index: number) => {
    set({ currentSnapshotIndex: index })
  },

  setFading: (fading: boolean) => {
    set({ isFading: fading })
  },
}))
