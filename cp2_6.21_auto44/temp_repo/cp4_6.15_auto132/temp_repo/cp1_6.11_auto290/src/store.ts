import { create } from 'zustand'

interface Student {
  id: string
  name: string
  studentId: string
}

interface Teacher {
  id: string
  name: string
  teacherId: string
}

type UserRole = 'student' | 'teacher' | null

interface AuthState {
  currentUser: Student | Teacher | null
  userRole: UserRole
  login: (user: Student | Teacher, role: UserRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  userRole: null,
  login: (user, role) => set({ currentUser: user, userRole: role }),
  logout: () => set({ currentUser: null, userRole: null }),
}))
