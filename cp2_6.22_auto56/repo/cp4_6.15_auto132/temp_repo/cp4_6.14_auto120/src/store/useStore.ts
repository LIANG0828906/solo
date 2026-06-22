import { create } from 'zustand';

export interface Member {
  id: string;
  name: string;
  membershipType: '月卡' | '季卡' | '年卡';
  expiryDate: string;
  status: '有效' | '即将到期' | '已过期';
}

export interface Booking {
  id: string;
  courseId: string;
  memberName: string;
  memberId: string;
}

export interface Course {
  id: string;
  name: string;
  coach: string;
  date: string;
  timeSlot: '09:00' | '14:00' | '19:00';
  capacity: number;
  bookings: Booking[];
  remainingCapacity?: number;
}

export interface CoachCourse {
  id: string;
  name: string;
  timeSlot: string;
  coach: string;
  bookedStudents: string[];
  totalBooked: number;
}

export interface CoachSchedule {
  date: string;
  courses: CoachCourse[];
}

const DISMISSED_KEY = 'fitclub_dismissed_renewals';

function loadDismissedIds(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDismissedIds(ids: string[]): void {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

interface StoreState {
  members: Member[];
  courses: Course[];
  coachSchedule: CoachSchedule | null;
  dismissedRenewalIds: string[];
  loading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  addMember: (name: string, membershipType: Member['membershipType']) => Promise<boolean>;
  renewMember: (id: string, membershipType: Member['membershipType']) => Promise<boolean>;
  fetchCourses: () => Promise<void>;
  createBooking: (courseId: string, memberName: string, memberId: string) => Promise<{ success: boolean; error?: string }>;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  fetchCoachSchedule: () => Promise<void>;
  dismissRenewal: (id: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  members: [],
  courses: [],
  coachSchedule: null,
  dismissedRenewalIds: loadDismissedIds(),
  loading: false,
  error: null,

  fetchMembers: async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success) {
        set({ members: data.data });
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  },

  addMember: async (name, membershipType) => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, membershipType }),
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchMembers();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  renewMember: async (id, membershipType) => {
    try {
      const res = await fetch(`/api/members/${id}/renew`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipType }),
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchMembers();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  fetchCourses: async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) {
        set({ courses: data.data });
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  },

  createBooking: async (courseId, memberName, memberId) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, memberName, memberId }),
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchCourses();
        await get().fetchCoachSchedule();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: '网络错误，请稍后重试' };
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchCourses();
        await get().fetchCoachSchedule();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  fetchCoachSchedule: async () => {
    try {
      const res = await fetch('/api/coach/schedule');
      const data = await res.json();
      if (data.success) {
        const today = new Date().toISOString().split('T')[0];
        set({
          coachSchedule: {
            date: today,
            courses: data.data,
          },
        });
      }
    } catch (err) {
      console.error('Failed to fetch coach schedule:', err);
    }
  },

  dismissRenewal: (id) => {
    const dismissed = [...get().dismissedRenewalIds, id];
    saveDismissedIds(dismissed);
    set({ dismissedRenewalIds: dismissed });
  },
}));
