import { create } from 'zustand'
import type { Question, Course, Chapter, StudentInfo } from '@shared/types'

interface AppState {
  selectedCourse: Course | null
  selectedChapter: Chapter | null
  selectedQuestions: Question[]
  currentStudent: StudentInfo | null

  setSelectedCourse: (course: Course | null) => void
  setSelectedChapter: (chapter: Chapter | null) => void
  addSelectedQuestion: (question: Question) => void
  removeSelectedQuestion: (questionId: string) => void
  toggleSelectedQuestion: (question: Question) => void
  clearSelectedQuestions: () => void
  setSelectedQuestions: (questions: Question[]) => void
  setCurrentStudent: (student: StudentInfo | null) => void
}

export const useStore = create<AppState>((set, get) => ({
  selectedCourse: null,
  selectedChapter: null,
  selectedQuestions: [],
  currentStudent: null,

  setSelectedCourse: (course) =>
    set({ selectedCourse: course, selectedChapter: null }),

  setSelectedChapter: (chapter) => set({ selectedChapter: chapter }),

  addSelectedQuestion: (question) => {
    const exists = get().selectedQuestions.some((q) => q.id === question.id)
    if (!exists) {
      set({ selectedQuestions: [...get().selectedQuestions, question] })
    }
  },

  removeSelectedQuestion: (questionId) =>
    set({
      selectedQuestions: get().selectedQuestions.filter(
        (q) => q.id !== questionId,
      ),
    }),

  toggleSelectedQuestion: (question) => {
    const exists = get().selectedQuestions.some((q) => q.id === question.id)
    if (exists) {
      set({
        selectedQuestions: get().selectedQuestions.filter(
          (q) => q.id !== question.id,
        ),
      })
    } else {
      set({ selectedQuestions: [...get().selectedQuestions, question] })
    }
  },

  clearSelectedQuestions: () => set({ selectedQuestions: [] }),

  setSelectedQuestions: (questions) => set({ selectedQuestions: questions }),

  setCurrentStudent: (student) => set({ currentStudent: student }),
}))
