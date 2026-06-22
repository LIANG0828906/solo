import { create } from 'zustand';
import { Work, Portfolio, Appointment } from './dataStore';

interface AppState {
  works: Work[];
  portfolios: Portfolio[];
  appointments: Appointment[];
  loading: boolean;
  appointmentModalOpen: boolean;
  selectedWorkId: string | null;
  setWorks: (works: Work[]) => void;
  setPortfolios: (portfolios: Portfolio[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setLoading: (loading: boolean) => void;
  updateWork: (work: Work) => void;
  removeWork: (id: string) => void;
  addWork: (work: Work) => void;
  openAppointmentModal: (workId?: string) => void;
  closeAppointmentModal: () => void;
  updateAppointment: (appointment: Appointment) => void;
  addAppointment: (appointment: Appointment) => void;
}

export const useAppStore = create<AppState>((set) => ({
  works: [],
  portfolios: [],
  appointments: [],
  loading: false,
  appointmentModalOpen: false,
  selectedWorkId: null,
  
  setWorks: (works) => set({ works }),
  setPortfolios: (portfolios) => set({ portfolios }),
  setAppointments: (appointments) => set({ appointments }),
  setLoading: (loading) => set({ loading }),
  
  updateWork: (work) => set((state) => ({
    works: state.works.map((w) => (w.id === work.id ? work : w)),
  })),
  
  removeWork: (id) => set((state) => ({
    works: state.works.filter((w) => w.id !== id),
  })),
  
  addWork: (work) => set((state) => ({
    works: [work, ...state.works],
  })),
  
  openAppointmentModal: (workId) => set({
    appointmentModalOpen: true,
    selectedWorkId: workId || null,
  }),
  
  closeAppointmentModal: () => set({
    appointmentModalOpen: false,
    selectedWorkId: null,
  }),
  
  updateAppointment: (appointment) => set((state) => ({
    appointments: state.appointments.map((a) =>
      a.id === appointment.id ? appointment : a
    ),
  })),
  
  addAppointment: (appointment) => set((state) => ({
    appointments: [appointment, ...state.appointments],
  })),
}));
