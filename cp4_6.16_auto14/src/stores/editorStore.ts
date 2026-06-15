import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type {
  Course,
  Page,
  AnyBlock,
  TextBlock,
  ImageBlock,
  QuizBlock,
  VersionSnapshot,
  BlockType,
  QuizOption,
} from '@/types'
import { idbKeyvalStorage, loadFromIDB, saveToIDB } from '@/utils/storage'

interface EditorState {
  courses: Course[]
  currentCourseId: string | null
  pages: Page[]
  currentPageId: string | null
  blocks: AnyBlock[]
  selectedBlockId: string | null
  versions: VersionSnapshot[]
  isPreviewMode: boolean
  isHistoryPanelOpen: boolean
  undoStack: string[]
  redoStack: string[]
  canUndo: boolean
  canRedo: boolean
}

interface EditorActions {
  pushUndo: () => void
  undo: () => void
  redo: () => void
  createCourse: (title: string) => void
  loadCourse: (courseId: string) => Promise<void>
  setCurrentCourse: (courseId: string) => void
  addPage: (title: string) => void
  deletePage: (pageId: string) => void
  reorderPages: (pageIds: string[]) => void
  setCurrentPage: (pageId: string) => void
  updatePage: (pageId: string, updates: Partial<Page>) => void
  addBlock: (type: BlockType) => void
  updateBlock: (blockId: string, updates: Partial<AnyBlock>) => void
  moveBlock: (blockId: string, x: number, y: number) => void
  resizeBlock: (blockId: string, width: number, height: number) => void
  deleteBlock: (blockId: string) => void
  selectBlock: (blockId: string | null) => void
  addQuizOption: (blockId: string) => void
  removeQuizOption: (blockId: string, optionId: string) => void
  updateQuizOption: (blockId: string, optionId: string, updates: Partial<QuizOption>) => void
  save: () => Promise<void>
  rollbackVersion: (versionId: string) => void
  togglePreview: () => void
  toggleHistoryPanel: () => void
}

type EditorStore = EditorState & EditorActions

const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      courses: [],
      currentCourseId: null,
      pages: [],
      currentPageId: null,
      blocks: [],
      selectedBlockId: null,
      versions: [],
      isPreviewMode: false,
      isHistoryPanelOpen: false,
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,

      pushUndo: () => {
        const { pages, blocks, undoStack } = get()
        const snapshot = JSON.stringify({ pages, blocks })
        set({
          undoStack: [...undoStack, snapshot],
          redoStack: [],
          canUndo: true,
          canRedo: false,
        })
      },

      undo: () => {
        const { undoStack, redoStack, pages, blocks } = get()
        if (undoStack.length === 0) return
        const currentSnapshot = JSON.stringify({ pages, blocks })
        const previousSnapshot = undoStack[undoStack.length - 1]
        const newUndoStack = undoStack.slice(0, -1)
        const restored = JSON.parse(previousSnapshot) as { pages: Page[]; blocks: AnyBlock[] }
        set({
          pages: restored.pages,
          blocks: restored.blocks,
          undoStack: newUndoStack,
          redoStack: [...redoStack, currentSnapshot],
          canUndo: newUndoStack.length > 0,
          canRedo: true,
        })
      },

      redo: () => {
        const { undoStack, redoStack, pages, blocks } = get()
        if (redoStack.length === 0) return
        const currentSnapshot = JSON.stringify({ pages, blocks })
        const nextSnapshot = redoStack[redoStack.length - 1]
        const newRedoStack = redoStack.slice(0, -1)
        const restored = JSON.parse(nextSnapshot) as { pages: Page[]; blocks: AnyBlock[] }
        set({
          pages: restored.pages,
          blocks: restored.blocks,
          undoStack: [...undoStack, currentSnapshot],
          redoStack: newRedoStack,
          canUndo: true,
          canRedo: newRedoStack.length > 0,
        })
      },

      createCourse: (title) => {
        const now = new Date().toISOString()
        const courseId = uuidv4()
        const pageId = uuidv4()
        const course: Course = {
          id: courseId,
          title,
          createdAt: now,
          updatedAt: now,
        }
        const firstPage: Page = {
          id: pageId,
          courseId,
          title: 'Page 1',
          backgroundColor: '#FFFFFF',
          order: 0,
        }
        set({
          courses: [...get().courses, course],
          currentCourseId: courseId,
          pages: [firstPage],
          currentPageId: pageId,
          blocks: [],
          selectedBlockId: null,
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
          versions: [],
        })
      },

      loadCourse: async (courseId) => {
        const pagesData = await loadFromIDB<Page[]>(`pages:${courseId}`)
        const blocksData = await loadFromIDB<AnyBlock[]>(`blocks:${courseId}`)
        const versionsData = await loadFromIDB<VersionSnapshot[]>(`versions:${courseId}`)
        const pages = pagesData ?? []
        const blocks = blocksData ?? []
        const versions = versionsData ?? []
        set({
          currentCourseId: courseId,
          pages,
          currentPageId: pages.length > 0 ? pages[0].id : null,
          blocks,
          selectedBlockId: null,
          versions,
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
        })
      },

      setCurrentCourse: (courseId) => {
        set({ currentCourseId: courseId })
      },

      addPage: (title) => {
        get().pushUndo()
        const { currentCourseId, pages } = get()
        if (!currentCourseId) return
        const pageId = uuidv4()
        const newPage: Page = {
          id: pageId,
          courseId: currentCourseId,
          title,
          backgroundColor: '#FFFFFF',
          order: pages.length,
        }
        set({
          pages: [...pages, newPage],
          currentPageId: pageId,
        })
      },

      deletePage: (pageId) => {
        get().pushUndo()
        const { pages, blocks, currentPageId } = get()
        const remainingPages = pages.filter((p) => p.id !== pageId)
        const remainingBlocks = blocks.filter((b) => b.pageId !== pageId)
        set({
          pages: remainingPages,
          blocks: remainingBlocks,
          currentPageId:
            currentPageId === pageId
              ? remainingPages.length > 0
                ? remainingPages[0].id
                : null
              : currentPageId,
        })
      },

      reorderPages: (pageIds) => {
        get().pushUndo()
        const { pages } = get()
        const reordered = pageIds
          .map((id, index) => {
            const page = pages.find((p) => p.id === id)
            return page ? { ...page, order: index } : null
          })
          .filter((p): p is Page => p !== null)
        set({ pages: reordered })
      },

      setCurrentPage: (pageId) => {
        set({ currentPageId: pageId, selectedBlockId: null })
      },

      updatePage: (pageId, updates) => {
        get().pushUndo()
        set({
          pages: get().pages.map((p) =>
            p.id === pageId ? { ...p, ...updates } : p
          ),
        })
      },

      addBlock: (type) => {
        get().pushUndo()
        const { currentPageId, blocks } = get()
        if (!currentPageId) return
        const blockId = uuidv4()
        const base = {
          id: blockId,
          pageId: currentPageId,
          x: 100,
          y: 100,
          width: 300,
          height: 200,
        }
        let newBlock: AnyBlock
        switch (type) {
          case 'text':
            newBlock = { ...base, type: 'text', content: '' } satisfies TextBlock
            break
          case 'image':
            newBlock = { ...base, type: 'image', url: '', alt: '' } satisfies ImageBlock
            break
          case 'quiz':
            newBlock = {
              ...base,
              type: 'quiz',
              question: '',
              mode: 'single',
              options: [
                { id: uuidv4(), text: '', isCorrect: false },
                { id: uuidv4(), text: '', isCorrect: false },
              ],
              score: 0,
            } satisfies QuizBlock
            break
          default:
            return
        }
        set({ blocks: [...blocks, newBlock] })
      },

      updateBlock: (blockId, updates) => {
        get().pushUndo()
        set({
          blocks: get().blocks.map((b) =>
            b.id === blockId ? ({ ...b, ...updates } as AnyBlock) : b
          ),
        })
      },

      moveBlock: (blockId, x, y) => {
        get().pushUndo()
        set({
          blocks: get().blocks.map((b) =>
            b.id === blockId ? { ...b, x, y } : b
          ),
        })
      },

      resizeBlock: (blockId, width, height) => {
        get().pushUndo()
        set({
          blocks: get().blocks.map((b) =>
            b.id === blockId ? { ...b, width, height } : b
          ),
        })
      },

      deleteBlock: (blockId) => {
        get().pushUndo()
        const { blocks, selectedBlockId } = get()
        set({
          blocks: blocks.filter((b) => b.id !== blockId),
          selectedBlockId: selectedBlockId === blockId ? null : selectedBlockId,
        })
      },

      selectBlock: (blockId) => {
        set({ selectedBlockId: blockId })
      },

      addQuizOption: (blockId) => {
        get().pushUndo()
        set({
          blocks: get().blocks.map((b) => {
            if (b.id === blockId && b.type === 'quiz') {
              const quiz = b as QuizBlock
              return {
                ...quiz,
                options: [
                  ...quiz.options,
                  { id: uuidv4(), text: '', isCorrect: false },
                ],
              } satisfies QuizBlock
            }
            return b
          }),
        })
      },

      removeQuizOption: (blockId, optionId) => {
        get().pushUndo()
        set({
          blocks: get().blocks.map((b) => {
            if (b.id === blockId && b.type === 'quiz') {
              const quiz = b as QuizBlock
              return {
                ...quiz,
                options: quiz.options.filter((o) => o.id !== optionId),
              } satisfies QuizBlock
            }
            return b
          }),
        })
      },

      updateQuizOption: (blockId, optionId, updates) => {
        get().pushUndo()
        set({
          blocks: get().blocks.map((b) => {
            if (b.id === blockId && b.type === 'quiz') {
              const quiz = b as QuizBlock
              return {
                ...quiz,
                options: quiz.options.map((o) =>
                  o.id === optionId ? { ...o, ...updates } : o
                ),
              } satisfies QuizBlock
            }
            return b
          }),
        })
      },

      save: async () => {
        const { currentCourseId, pages, blocks, courses, versions } = get()
        if (!currentCourseId) return
        await saveToIDB(`pages:${currentCourseId}`, pages)
        await saveToIDB(`blocks:${currentCourseId}`, blocks)
        const now = new Date().toISOString()
        const version: VersionSnapshot = {
          id: uuidv4(),
          courseId: currentCourseId,
          timestamp: now,
          note: `Saved at ${now}`,
          data: JSON.stringify({ pages, blocks }),
        }
        const newVersions = [...versions, version]
        await saveToIDB(`versions:${currentCourseId}`, newVersions)
        set({
          versions: newVersions,
          courses: courses.map((c) =>
            c.id === currentCourseId ? { ...c, updatedAt: now } : c
          ),
        })
      },

      rollbackVersion: (versionId) => {
        const { versions } = get()
        const version = versions.find((v) => v.id === versionId)
        if (!version) return
        const restored = JSON.parse(version.data) as {
          pages: Page[]
          blocks: AnyBlock[]
        }
        set({
          pages: restored.pages,
          blocks: restored.blocks,
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
        })
      },

      togglePreview: () => {
        set({ isPreviewMode: !get().isPreviewMode })
      },

      toggleHistoryPanel: () => {
        set({ isHistoryPanelOpen: !get().isHistoryPanelOpen })
      },
    }),
    {
      name: 'courseforge-meta',
      storage: createJSONStorage(() => idbKeyvalStorage),
      partialize: (state) => ({
        courses: state.courses,
        currentCourseId: state.currentCourseId,
      }),
    }
  )
)

export default useEditorStore
