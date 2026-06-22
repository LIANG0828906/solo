import { create } from 'zustand';
import { User, Room, Submission, FeedbackResponse, DimensionType } from '@/types';

interface AppState {
  user: User | null;
  room: Room | null;
  submissions: Submission[];
  assignedSubmissions: Submission[];
  feedbackData: FeedbackResponse | null;
  theme: 'dark' | 'light';
  phase: 'login' | 'reviewing' | 'completed';
  notifications: { id: string; message: string; type: 'info' | 'success' }[];
  currentSubmissionIndex: number;
  reviewProgress: { completed: number; total: number };
  
  setUser: (user: User) => void;
  setRoom: (room: Room) => void;
  setSubmissions: (submissions: Submission[]) => void;
  setAssignedSubmissions: (submissions: Submission[]) => void;
  setFeedbackData: (data: FeedbackResponse) => void;
  toggleTheme: () => void;
  setPhase: (phase: 'login' | 'reviewing' | 'completed') => void;
  addNotification: (message: string, type: 'info' | 'success') => void;
  removeNotification: (id: string) => void;
  setCurrentSubmissionIndex: (index: number) => void;
  setReviewProgress: (completed: number, total: number) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  room: null,
  submissions: [],
  assignedSubmissions: [],
  feedbackData: null,
  theme: 'dark' as const,
  phase: 'login' as const,
  notifications: [],
  currentSubmissionIndex: 0,
  reviewProgress: { completed: 0, total: 0 },
};

export const useStore = create<AppState>((set) => ({
  ...initialState,
  
  setUser: (user) => set({ user }),
  setRoom: (room) => set({ room }),
  setSubmissions: (submissions) => set({ submissions }),
  setAssignedSubmissions: (submissions) => set({ assignedSubmissions: submissions }),
  setFeedbackData: (data) => set({ feedbackData: data }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setPhase: (phase) => set({ phase }),
  addNotification: (message, type) => set((state) => ({
    notifications: [...state.notifications, { id: Date.now().toString(), message, type }],
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  setCurrentSubmissionIndex: (index) => set({ currentSubmissionIndex: index }),
  setReviewProgress: (completed, total) => set({ reviewProgress: { completed, total } }),
  reset: () => set(initialState),
}));