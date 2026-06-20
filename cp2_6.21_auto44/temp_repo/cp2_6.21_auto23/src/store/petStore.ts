import { create } from 'zustand';
import type { Pet, Service, Appointment, Review, ReviewStats } from '@/types';

const SERVICES: Service[] = [
  { id: 's1', name: '基础洗护', priceRange: '¥80-120', duration: '约45分钟', color: '#a8d5e2', icon: '🛁', description: '深层清洁+护毛素护理' },
  { id: 's2', name: '剪毛造型', priceRange: '¥150-280', duration: '约90分钟', color: '#f4c7ab', icon: '✂️', description: '专业造型师一对一设计' },
  { id: 's3', name: 'SPA护理', priceRange: '¥200-350', duration: '约60分钟', color: '#c5b3d9', icon: '💆', description: '精油按摩+舒缓香氛疗愈' },
  { id: 's4', name: '指甲修剪', priceRange: '¥30-50', duration: '约15分钟', color: '#b5d8b0', icon: '💅', description: '专业打磨+指甲护理精华' },
  { id: 's5', name: '耳眼清洁', priceRange: '¥40-60', duration: '约20分钟', color: '#f7d794', icon: '👁️', description: '温和清洁+预防耳道疾病' },
  { id: 's6', name: '全身除虫', priceRange: '¥120-180', duration: '约30分钟', color: '#e6a0a0', icon: '🛡️', description: '安全驱虫+长效防护处理' },
];

interface PetStoreState {
  services: Service[];
  pets: Pet[];
  appointments: Appointment[];
  reviews: Review[];
  selectedPetId: string | null;
  sidebarOpen: boolean;

  addPet: (pet: Omit<Pet, 'id'>) => void;
  removePet: (id: string) => void;
  updatePet: (id: string, updates: Partial<Omit<Pet, 'id'>>) => void;
  selectPet: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  addAppointment: (apt: Omit<Appointment, 'id'>) => string | null;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  completeAppointment: (id: string) => void;
  isSlotOccupied: (date: string, timeSlot: string, excludeId?: string) => boolean;
  canMoveAppointment: (appointmentId: string, targetDate: string, targetTimeSlot: string) => boolean;

  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  getReviewStats: () => ReviewStats;
  getReviewsForPet: (petId: string) => Review[];
  getAppointmentReview: (appointmentId: string) => Review | undefined;
}

let idCounter = 0;
function genId(prefix: string): string {
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

export const usePetStore = create<PetStoreState>((set, get) => ({
  services: SERVICES,
  pets: [],
  appointments: [],
  reviews: [],
  selectedPetId: null,
  sidebarOpen: false,

  addPet: (pet) => {
    const newPet: Pet = { ...pet, id: genId('pet') };
    set((s) => ({ pets: [...s.pets, newPet] }));
  },

  removePet: (id) => {
    set((s) => ({
      pets: s.pets.filter((p) => p.id !== id),
      appointments: s.appointments.filter((a) => a.petId !== id),
      selectedPetId: s.selectedPetId === id ? null : s.selectedPetId,
    }));
  },

  updatePet: (id, updates) => {
    set((s) => ({
      pets: s.pets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  selectPet: (id) => {
    set({ selectedPetId: id });
  },

  toggleSidebar: () => {
    set((s) => ({ sidebarOpen: !s.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  addAppointment: (apt) => {
    const state = get();
    if (state.isSlotOccupied(apt.date, apt.timeSlot)) {
      return null;
    }
    const id = genId('apt');
    set((s) => ({
      appointments: [...s.appointments, { ...apt, id }],
    }));
    return id;
  },

  updateAppointment: (id, updates) => {
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  deleteAppointment: (id) => {
    set((s) => ({
      appointments: s.appointments.filter((a) => a.id !== id),
      reviews: s.reviews.filter((r) => r.appointmentId !== id),
    }));
  },

  completeAppointment: (id) => {
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === id ? { ...a, status: 'completed' as const } : a
      ),
    }));
  },

  isSlotOccupied: (date, timeSlot, excludeId) => {
    const state = get();
    return state.appointments.some(
      (a) => a.date === date && a.timeSlot === timeSlot && a.id !== excludeId
    );
  },

  canMoveAppointment: (appointmentId, targetDate, targetTimeSlot) => {
    return !get().isSlotOccupied(targetDate, targetTimeSlot, appointmentId);
  },

  addReview: (review) => {
    const id = genId('rev');
    const newReview: Review = {
      ...review,
      id,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ reviews: [...s.reviews, newReview] }));
  },

  getReviewStats: () => {
    const state = get();
    const completedApts = state.appointments.filter((a) => a.status === 'completed');
    const totalServices = completedApts.length;
    const aptReviews = state.reviews.filter((r) =>
      completedApts.some((a) => a.id === r.appointmentId)
    );
    const averageRating =
      aptReviews.length > 0
        ? Math.round((aptReviews.reduce((sum, r) => sum + r.rating, 0) / aptReviews.length) * 10) / 10
        : 0;
    const recentReviews = [...aptReviews]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    return { totalServices, averageRating, recentReviews };
  },

  getReviewsForPet: (petId) => {
    const state = get();
    const petAptIds = state.appointments
      .filter((a) => a.petId === petId)
      .map((a) => a.id);
    return state.reviews.filter((r) => petAptIds.includes(r.appointmentId));
  },

  getAppointmentReview: (appointmentId) => {
    return get().reviews.find((r) => r.appointmentId === appointmentId);
  },
}));
