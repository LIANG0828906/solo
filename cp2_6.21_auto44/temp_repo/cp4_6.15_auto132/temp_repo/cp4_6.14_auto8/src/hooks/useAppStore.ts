import { create } from 'zustand';
import type { Assignment, Submission } from '@/types';

interface AppState {
  role: 'student' | 'teacher' | null;
  currentAssignmentId: string | null;
  sidebarOpen: boolean;
  setRole: (role: 'student' | 'teacher') => void;
  setCurrentAssignmentId: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: null,
  currentAssignmentId: 'a1',
  sidebarOpen: true,
  setRole: (role) => set({ role }),
  setCurrentAssignmentId: (id) => set({ currentAssignmentId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
