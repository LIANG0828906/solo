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
import { idbKeyvalStorage, loadVersions, saveVersion, loadCourse, saveCourse } from '@/utils/storage'

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
  loadCourseById: (courseId: string) => Promise<void>
  setCurrentCourse: (courseId: string) => void
  addPage: (title: string) => void
  deletePage: (pageId: string) => void
  reorderPages: (pageIds: string[]) => void
  setCurrentPage: (pageId: string) => void
  updatePage: (pageId: string, updates: Partial<Page>) => void
  addBlock: (type: BlockType, x?: number, y?: number) => void
  updateBlock: (blockId: string, updates: Partial<AnyBlock>) => void
  moveBlock: (blockId: string, x: number, y: number) => void
  moveBlockEnd: (blockId: string, x: number, y: number) => void
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
  importCourse: (course: Course, pages: Page[], blocks: AnyBlock[]) => void
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
        const newUndoStack = [...undoStack, snapshot].slice(-50)
        set({
          undoStack: newUndoStack,
          redoStack: [],
          canUndo: newUndoStack.length > 0,
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
        const currentPageId = get().currentPageId
        const pageExists = restored.pages.some((p) => p.id === currentPageId)
        set({
          pages: restored.pages,
          blocks: restored.blocks,
          currentPageId: pageExists ? currentPageId : restored.pages[0]?.id ?? null,
          undoStack: newUndoStack,
          redoStack: [...redoStack, currentSnapshot],
          canUndo: newUndoStack.length > 0,
          canRedo: true,
          selectedBlockId: null,
        })
      },

      redo: () => {
        const { undoStack, redoStack, pages, blocks } = get()
        if (redoStack.length === 0) return
        const currentSnapshot = JSON.stringify({ pages, blocks })
        const nextSnapshot = redoStack[redoStack.length - 1]
        const newRedoStack = redoStack.slice(0, -1)
        const restored = JSON.parse(nextSnapshot) as { pages: Page[]; blocks: AnyBlock[] }
        const currentPageId = get().currentPageId
        const pageExists = restored.pages.some((p) => p.id === currentPageId)
        set({
          pages: restored.pages,
          blocks: restored.blocks,
          currentPageId: pageExists ? currentPageId : restored.pages[0]?.id ?? null,
          undoStack: [...undoStack, currentSnapshot],
          redoStack: newRedoStack,
          canUndo: true,
          canRedo: newRedoStack.length > 0,
          selectedBlockId: null,
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
          title: '第一页',
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

      loadCourseById: async (courseId) => {
        const data = await loadCourse(courseId)
        const versions = await loadVersions(courseId)
        if (!data) return
        set({
          currentCourseId: courseId,
          pages: data.pages,
          currentPageId: data.pages.length > 0 ? data.pages[0].id : null,
          blocks: data.blocks,
          selectedBlockId: null,
          versions,
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
        })
        const courseExists = get().courses.some((c) => c.id === courseId)
        if (!courseExists) {
          set({ courses: [...get().courses, data.course] })
        }
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
        const reorderedPages = remainingPages.map((p, idx) => ({ ...p, order: idx }))
        set({
          pages: reorderedPages,
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

      addBlock: (type, x = 100, y = 100) => {
        get().pushUndo()
        const { currentPageId, blocks } = get()
        if (!currentPageId) return
        const blockId = uuidv4()
        const base = {
          id: blockId,
          pageId: currentPageId,
          x,
          y,
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
              question: '请输入问题',
              mode: 'single',
              options: [
                { id: uuidv4(), text: '选项 A', isCorrect: false },
                { id: uuidv4(), text: '选项 B', isCorrect: false },
              ],
              score: 10,
            } satisfies QuizBlock
            break
          default:
            return
        }
        set({ blocks: [...blocks, newBlock], selectedBlockId: blockId })
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
        set({
          blocks: get().blocks.map((b) =>
            b.id === blockId ? { ...b, x, y } : b
          ),
        })
      },

      moveBlockEnd: (blockId, x, y) => {
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
                  { id: uuidv4(), text: '新选项', isCorrect: false },
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
        set({
          blocks: get().blocks.map((b) => {
            if (b.id === blockId && b.type === 'quiz') {
              const quiz = b as QuizBlock
              const newOptions = quiz.options.map((o) =>
                o.id === optionId ? { ...o, ...updates } : o
              )
              if (updates.isCorrect === true && quiz.mode === 'single') {
                return {
                  ...quiz,
                  options: newOptions.map((o) =>
                    o.id === optionId ? o : { ...o, isCorrect: false }
                  ),
                } satisfies QuizBlock
              }
              return { ...quiz, options: newOptions } satisfies QuizBlock
            }
            return b
          }),
        })
      },

      save: async () => {
        const { currentCourseId, pages, blocks, courses, versions } = get()
        if (!currentCourseId) return
        const course = courses.find((c) => c.id === currentCourseId)
        if (!course) return
        const now = new Date().toISOString()
        const updatedCourse = { ...course, updatedAt: now }
        await saveCourse(updatedCourse, pages, blocks)
        const version: VersionSnapshot = {
          id: uuidv4(),
          courseId: currentCourseId,
          timestamp: now,
          note: `版本 - ${new Date(now).toLocaleString()}`,
          data: JSON.stringify({ pages, blocks }),
        }
        await saveVersion(version)
        const newVersions = [...versions, version]
        set({
          versions: newVersions,
          courses: courses.map((c) =>
            c.id === currentCourseId ? updatedCourse : c
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
        get().pushUndo()
        const currentPageId = get().currentPageId
        const pageExists = restored.pages.some((p) => p.id === currentPageId)
        set({
          pages: restored.pages,
          blocks: restored.blocks,
          currentPageId: pageExists ? currentPageId : restored.pages[0]?.id ?? null,
          selectedBlockId: null,
        })
      },

      togglePreview: () => {
        set({ isPreviewMode: !get().isPreviewMode, selectedBlockId: null })
      },

      toggleHistoryPanel: () => {
        set({ isHistoryPanelOpen: !get().isHistoryPanelOpen })
      },

      importCourse: (course, pages, blocks) => {
        const now = new Date().toISOString()
        const newCourse = { ...course, id: uuidv4(), createdAt: now, updatedAt: now }
        const pageIdMap = new Map<string, string>()
        const newPages = pages.map((p, idx) => {
          const newId = uuidv4()
          pageIdMap.set(p.id, newId)
          return { ...p, id: newId, courseId: newCourse.id, order: idx }
        })
        const newBlocks = blocks.map((b) => {
          const newId = uuidv4()
          const newPageId = pageIdMap.get(b.pageId) ?? b.pageId
          const base = { ...b, id: newId, pageId: newPageId }
          if (b.type === 'quiz') {
            return {
              ...base,
              options: b.options.map((o) => ({ ...o, id: uuidv4() })),
            } as QuizBlock
          }
          return base as AnyBlock
        })
        set({
          courses: [...get().courses, newCourse],
          currentCourseId: newCourse.id,
          pages: newPages,
          currentPageId: newPages.length > 0 ? newPages[0].id : null,
          blocks: newBlocks,
          selectedBlockId: null,
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
          versions: [],
        })
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
