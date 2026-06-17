import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { CourseType } from '../data/courseData';

export interface Appointment {
  id: string;
  courseId: string;
  time: string;
  name: string;
  status: '已预约' | '已完成';
  createdAt: number;
}

interface AppState {
  filterType: '全部' | CourseType;
  favoriteIds: string[];
  appointments: Appointment[];
  setFilterType: (type: '全部' | CourseType) => void;
  toggleFavorite: (courseId: string) => void;
  addAppointment: (params: { courseId: string; time: string; name: string }) => void;
  removeAppointment: (appointmentId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  filterType: '全部',
  favoriteIds: [],
  appointments: [],

  setFilterType: (type) => set({ filterType: type }),

  toggleFavorite: (courseId) =>
    set((state) => {
      const exists = state.favoriteIds.includes(courseId);
      return {
        favoriteIds: exists
          ? state.favoriteIds.filter((id) => id !== courseId)
          : [...state.favoriteIds, courseId],
      };
    }),

  addAppointment: ({ courseId, time, name }) =>
    set((state) => ({
      appointments: [
        ...state.appointments,
        {
          id: uuidv4(),
          courseId,
          time,
          name,
          status: '已预约',
          createdAt: Date.now(),
        },
      ],
    })),

  removeAppointment: (appointmentId) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== appointmentId),
    })),
}));
