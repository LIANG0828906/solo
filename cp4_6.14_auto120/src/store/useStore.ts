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

const MEMBERS_KEY = 'fitclub_members';
const COURSES_KEY = 'fitclub_courses';
const DISMISSED_KEY = 'fitclub_dismissed';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function computeStatus(expiryDate: string): Member['status'] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return '已过期';
  if (diffDays <= 7) return '即将到期';
  return '有效';
}

function getMembershipDays(type: Member['membershipType']): number {
  switch (type) {
    case '月卡': return 30;
    case '季卡': return 90;
    case '年卡': return 365;
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createMockMembers(): Member[] {
  const today = new Date();
  const raw: Omit<Member, 'status'>[] = [
    { id: 'm1', name: '张伟', membershipType: '年卡', expiryDate: formatDate(addDays(today, 180)) },
    { id: 'm2', name: '李娜', membershipType: '季卡', expiryDate: formatDate(addDays(today, 5)) },
    { id: 'm3', name: '王强', membershipType: '月卡', expiryDate: formatDate(addDays(today, -10)) },
    { id: 'm4', name: '刘洋', membershipType: '年卡', expiryDate: formatDate(addDays(today, 300)) },
    { id: 'm5', name: '陈思', membershipType: '季卡', expiryDate: formatDate(addDays(today, 2)) },
    { id: 'm6', name: '赵敏', membershipType: '月卡', expiryDate: formatDate(addDays(today, 25)) },
    { id: 'm7', name: '孙磊', membershipType: '月卡', expiryDate: formatDate(addDays(today, -3)) },
    { id: 'm8', name: '周芳', membershipType: '年卡', expiryDate: formatDate(addDays(today, 1)) },
  ];
  return raw.map(m => ({ ...m, status: computeStatus(m.expiryDate) }));
}

function createMockCourses(): Course[] {
  const courseNames = ['瑜伽', '动感单车', '搏击操', '普拉提', '有氧舞蹈', '力量训练', '拉伸放松'];
  const coaches = ['李教练', '王教练', '张教练', '陈教练', '刘教练'];
  const timeSlots: Course['timeSlot'][] = ['09:00', '14:00', '19:00'];
  const today = new Date();
  const courses: Course[] = [];

  for (let day = 0; day < 7; day++) {
    const date = formatDate(addDays(today, day));
    for (let si = 0; si < timeSlots.length; si++) {
      const idx = day * 3 + si;
      courses.push({
        id: `c${day}-${si}`,
        name: courseNames[idx % courseNames.length],
        coach: coaches[(day + si) % coaches.length],
        date,
        timeSlot: timeSlots[si],
        capacity: 10,
        bookings: [],
      });
    }
  }

  return courses;
}

function loadMembers(): Member[] {
  const stored = localStorage.getItem(MEMBERS_KEY);
  if (stored) {
    const members = JSON.parse(stored) as Member[];
    return members.map(m => ({ ...m, status: computeStatus(m.expiryDate) }));
  }
  const members = createMockMembers();
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  return members;
}

function loadCourses(): Course[] {
  const stored = localStorage.getItem(COURSES_KEY);
  if (stored) return JSON.parse(stored) as Course[];
  const courses = createMockCourses();
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  return courses;
}

function loadDismissedIds(): string[] {
  const stored = localStorage.getItem(DISMISSED_KEY);
  return stored ? JSON.parse(stored) : [];
}

interface StoreState {
  members: Member[];
  courses: Course[];
  coachSchedule: CoachSchedule | null;
  dismissedRenewalIds: string[];
  fetchMembers: () => void;
  addMember: (name: string, membershipType: Member['membershipType']) => void;
  renewMember: (id: string, membershipType: Member['membershipType']) => void;
  fetchCourses: () => void;
  createBooking: (courseId: string, memberName: string, memberId: string) => void;
  cancelBooking: (courseId: string, bookingId: string) => void;
  fetchCoachSchedule: () => void;
  dismissRenewal: (id: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  members: loadMembers(),
  courses: loadCourses(),
  coachSchedule: null,
  dismissedRenewalIds: loadDismissedIds(),

  fetchMembers: () => {
    set({ members: loadMembers() });
  },

  addMember: (name, membershipType) => {
    const today = new Date();
    const expiryDate = formatDate(addDays(today, getMembershipDays(membershipType)));
    const newMember: Member = {
      id: generateId(),
      name,
      membershipType,
      expiryDate,
      status: '有效',
    };
    const members = [...get().members, newMember];
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    set({ members });
  },

  renewMember: (id, membershipType) => {
    const today = new Date();
    const expiryDate = formatDate(addDays(today, getMembershipDays(membershipType)));
    const members = get().members.map(m =>
      m.id === id
        ? { ...m, membershipType, expiryDate, status: computeStatus(expiryDate) }
        : m
    );
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    set({ members });
  },

  fetchCourses: () => {
    set({ courses: loadCourses() });
  },

  createBooking: (courseId, memberName, memberId) => {
    const courses = get().courses.map(c => {
      if (c.id === courseId && c.bookings.length < c.capacity) {
        return {
          ...c,
          bookings: [...c.bookings, { id: generateId(), courseId, memberName, memberId }],
        };
      }
      return c;
    });
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    set({ courses });
  },

  cancelBooking: (courseId, bookingId) => {
    const courses = get().courses.map(c => {
      if (c.id === courseId) {
        return { ...c, bookings: c.bookings.filter(b => b.id !== bookingId) };
      }
      return c;
    });
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    set({ courses });
  },

  fetchCoachSchedule: () => {
    const today = formatDate(new Date());
    const todayCourses = get().courses.filter(c => c.date === today);
    const coachCourses: CoachCourse[] = todayCourses.map(c => ({
      id: c.id,
      name: c.name,
      timeSlot: c.timeSlot,
      coach: c.coach,
      bookedStudents: c.bookings.map(b => b.memberName),
      totalBooked: c.bookings.length,
    }));
    coachCourses.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    set({ coachSchedule: { date: today, courses: coachCourses } });
  },

  dismissRenewal: (id) => {
    const dismissed = [...get().dismissedRenewalIds, id];
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    set({ dismissedRenewalIds: dismissed });
  },
}));
