import { create } from 'zustand'
import type {
  AppStore,
  Exhibit,
  QuizState,
  DeviceType,
} from '@/types'

export const useAppStore = create<AppStore>((set) => ({
  exhibits: [],
  quizStates: [],
  favorites: [],
  selectedExhibitId: null,
  activeQuizId: null,
  isOnTour: false,
  currentWaypointIndex: 0,
  deviceType: 'desktop',

  setExhibits: (exhibits: Exhibit[]) => set({ exhibits }),

  setQuizStates: (quizStates: QuizState[]) => set({ quizStates }),

  toggleFavorite: (exhibitId: string) =>
    set((state) => ({
      favorites: state.favorites.includes(exhibitId)
        ? state.favorites.filter((id) => id !== exhibitId)
        : [...state.favorites, exhibitId],
    })),

  setSelectedExhibit: (exhibitId: string | null) =>
    set({ selectedExhibitId: exhibitId }),

  setActiveQuiz: (quizId: string | null) => set({ activeQuizId: quizId }),

  updateQuizState: (quizState: QuizState) =>
    set((state) => {
      const existingIndex = state.quizStates.findIndex(
        (qs) => qs.quizId === quizState.quizId && qs.userId === quizState.userId
      )
      if (existingIndex >= 0) {
        const newQuizStates = [...state.quizStates]
        newQuizStates[existingIndex] = quizState
        return { quizStates: newQuizStates }
      }
      return { quizStates: [...state.quizStates, quizState] }
    }),

  startTour: () => set({ isOnTour: true, currentWaypointIndex: 0 }),

  stopTour: () => set({ isOnTour: false, currentWaypointIndex: 0 }),

  setCurrentWaypoint: (index: number) => set({ currentWaypointIndex: index }),

  setDeviceType: (deviceType: DeviceType) => set({ deviceType }),
}))
