import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface DocItem {
  id: string
  title: string
  content: string
  formatMarks: string[]
  updatedAt: number
  createdAt: number
}

const STORAGE_KEY = 'quickdoc_documents'

function loadDocuments(): DocItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveDocuments(docs: DocItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

export interface DocumentState {
  documents: DocItem[]
  activeDocId: string | null
  content: string
  title: string
  formatMarks: string[]
  createDoc: (title: string) => void
  deleteDoc: (id: string) => string | null
  switchDoc: (id: string) => void
  updateContent: (content: string) => void
  updateTitle: (title: string) => void
  updateFormatMarks: (marks: string[]) => void
}

export const useDocumentStore = create<DocumentState>((set, get) => {
  const initialDocs = loadDocuments()
  const initialActiveId = initialDocs.length > 0 ? initialDocs[0].id : null
  const initialActive = initialDocs.find(d => d.id === initialActiveId)

  return {
    documents: initialDocs,
    activeDocId: initialActiveId,
    content: initialActive?.content ?? '',
    title: initialActive?.title ?? '',
    formatMarks: initialActive?.formatMarks ?? [],

    createDoc: (title: string) => {
      const now = Date.now()
      const newDoc: DocItem = {
        id: uuidv4(),
        title,
        content: '',
        formatMarks: [],
        updatedAt: now,
        createdAt: now,
      }
      const docs = [...get().documents, newDoc]
      saveDocuments(docs)
      set({
        documents: docs,
        activeDocId: newDoc.id,
        content: '',
        title: newDoc.title,
        formatMarks: [],
      })
    },

    deleteDoc: (id: string) => {
      const docs = get().documents
      const index = docs.findIndex(d => d.id === id)
      if (index === -1) return null

      const remaining = docs.filter(d => d.id !== id)
      saveDocuments(remaining)

      const state = get()
      let nextActiveId: string | null = null

      if (state.activeDocId === id) {
        const nextDoc = remaining.length > 0
          ? remaining[Math.min(index, remaining.length - 1)]
          : null
        nextActiveId = nextDoc?.id ?? null
        set({
          documents: remaining,
          activeDocId: nextActiveId,
          content: nextDoc?.content ?? '',
          title: nextDoc?.title ?? '',
          formatMarks: nextDoc?.formatMarks ?? [],
        })
      } else {
        set({ documents: remaining })
      }

      return nextActiveId
    },

    switchDoc: (id: string) => {
      const doc = get().documents.find(d => d.id === id)
      if (doc) {
        set({
          activeDocId: id,
          content: doc.content,
          title: doc.title,
          formatMarks: doc.formatMarks,
        })
      }
    },

    updateContent: (content: string) => {
      const { activeDocId, documents } = get()
      if (!activeDocId) return
      const now = Date.now()
      const docs = documents.map(d =>
        d.id === activeDocId ? { ...d, content, updatedAt: now } : d
      )
      saveDocuments(docs)
      set({ content, documents: docs })
    },

    updateTitle: (title: string) => {
      const { activeDocId, documents } = get()
      if (!activeDocId) return
      const now = Date.now()
      const docs = documents.map(d =>
        d.id === activeDocId ? { ...d, title, updatedAt: now } : d
      )
      saveDocuments(docs)
      set({ title, documents: docs })
    },

    updateFormatMarks: (marks: string[]) => {
      const { activeDocId, documents } = get()
      if (!activeDocId) return
      const docs = documents.map(d =>
        d.id === activeDocId ? { ...d, formatMarks: marks, updatedAt: Date.now() } : d
      )
      saveDocuments(docs)
      set({ formatMarks: marks, documents: docs })
    },
  }
})
