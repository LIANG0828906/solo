import { create } from 'zustand';
import type { User, Schedule, ChatMessage, Recommendation } from '@/shared/types';

interface AppState {
  users: User[];
  schedules: Schedule[];
  messages: ChatMessage[];
  selectedScheduleId: string | null;
  selectedParticipantIds: string[];
  meetingDuration: number;
  recommendations: Recommendation[];
  sidebarOpen: boolean;
  chatOpen: boolean;
  chatMinimized: boolean;
  currentMonth: Date;

  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  removeSchedule: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setSelectedScheduleId: (id: string | null) => void;
  toggleParticipant: (id: string) => void;
  setMeetingDuration: (duration: number) => void;
  setRecommendations: (recommendations: Recommendation[]) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  toggleChatMinimize: () => void;
  setCurrentMonth: (date: Date) => void;
}

export const useStore = create<AppState>((set) => ({
  users: [],
  schedules: [],
  messages: [],
  selectedScheduleId: null,
  selectedParticipantIds: [],
  meetingDuration: 30,
  recommendations: [],
  sidebarOpen: true,
  chatOpen: false,
  chatMinimized: false,
  currentMonth: new Date(),

  setUsers: (users) => set({ users }),
  addUser: (user) => set((s) => ({ users: [...s.users, user] })),
  removeUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
  setSchedules: (schedules) => set({ schedules }),
  addSchedule: (schedule) => set((s) => ({ schedules: [...s.schedules, schedule] })),
  removeSchedule: (id) => set((s) => ({ schedules: s.schedules.filter((sc) => sc.id !== id) })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setSelectedScheduleId: (id) => set({ selectedScheduleId: id }),
  toggleParticipant: (id) =>
    set((s) => ({
      selectedParticipantIds: s.selectedParticipantIds.includes(id)
        ? s.selectedParticipantIds.filter((pid) => pid !== id)
        : [...s.selectedParticipantIds, id],
    })),
  setMeetingDuration: (duration) => set({ meetingDuration: duration }),
  setRecommendations: (recommendations) => set({ recommendations }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  toggleChatMinimize: () => set((s) => ({ chatMinimized: !s.chatMinimized })),
  setCurrentMonth: (date) => set({ currentMonth: date }),
}));
