import { create } from 'zustand';
import type { Course, CourseInput, ColorTag } from './types';

type DayFilter = 'all' | 'mwf' | 'tt';

interface ScheduleState {
  courses: Course[];
  loading: boolean;
  dayFilter: DayFilter;
  typeFilter: Set<ColorTag>;
  editingCourse: Course | null;
  formSlot: { dayOfWeek: number; startSlot: number } | null;
  showForm: boolean;
  notification: { message: string; type: 'error' | 'success' } | null;

  fetchCourses: () => Promise<void>;
  addCourse: (input: CourseInput) => Promise<void>;
  updateCourse: (id: string, input: CourseInput) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  batchImport: (inputs: CourseInput[]) => Promise<void>;

  setDayFilter: (filter: DayFilter) => void;
  toggleTypeFilter: (tag: ColorTag) => void;

  openFormForSlot: (dayOfWeek: number, startSlot: number) => void;
  openFormForEdit: (course: Course) => void;
  closeForm: () => void;

  setNotification: (notification: { message: string; type: 'error' | 'success' } | null) => void;

  getFilteredCourses: () => Course[];
  getConflicts: () => Set<string>;
}

const API_BASE = '/api/courses';

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  courses: [],
  loading: false,
  dayFilter: 'all',
  typeFilter: new Set<ColorTag>(['major', 'elective', 'pe', 'lab']),
  editingCourse: null,
  formSlot: null,
  showForm: false,
  notification: null,

  fetchCourses: async () => {
    set({ loading: true });
    try {
      const courses = await api<Course[]>(API_BASE);
      set({ courses, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addCourse: async (input) => {
    try {
      const course = await api<Course>(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      set((state) => ({ courses: [...state.courses, course], showForm: false }));
    } catch (e) {
      set({
        notification: { message: (e as Error).message || '添加失败', type: 'error' },
      });
    }
  },

  updateCourse: async (id, input) => {
    try {
      const course = await api<Course>(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      set((state) => ({
        courses: state.courses.map((c) => (c.id === id ? course : c)),
        showForm: false,
        editingCourse: null,
      }));
    } catch (e) {
      set({
        notification: { message: (e as Error).message || '更新失败', type: 'error' },
      });
    }
  },

  deleteCourse: async (id) => {
    try {
      await api(`${API_BASE}/${id}`, { method: 'DELETE' });
      set((state) => ({ courses: state.courses.filter((c) => c.id !== id) }));
    } catch (e) {
      set({
        notification: { message: (e as Error).message || '删除失败', type: 'error' },
      });
    }
  },

  batchImport: async (inputs) => {
    try {
      const courses = await api<Course[]>(`${API_BASE}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      set((state) => ({
        courses: [...state.courses, ...courses],
        notification: { message: `成功导入 ${courses.length} 门课程`, type: 'success' },
      }));
    } catch (e) {
      set({
        notification: { message: (e as Error).message || '导入失败，请检查文件格式', type: 'error' },
      });
    }
  },

  setDayFilter: (filter) => set({ dayFilter: filter }),

  toggleTypeFilter: (tag) =>
    set((state) => {
      const next = new Set(state.typeFilter);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return { typeFilter: next };
    }),

  openFormForSlot: (dayOfWeek, startSlot) =>
    set({
      formSlot: { dayOfWeek, startSlot },
      editingCourse: null,
      showForm: true,
    }),

  openFormForEdit: (course) =>
    set({
      editingCourse: course,
      formSlot: null,
      showForm: true,
    }),

  closeForm: () =>
    set({
      showForm: false,
      editingCourse: null,
      formSlot: null,
    }),

  setNotification: (notification) => set({ notification }),

  getFilteredCourses: () => {
    const { courses, dayFilter, typeFilter } = get();
    const allowedDays: Set<number> = new Set();
    if (dayFilter === 'all') {
      for (let i = 0; i < 7; i++) allowedDays.add(i);
    } else if (dayFilter === 'mwf') {
      allowedDays.add(0).add(2).add(4);
    } else {
      allowedDays.add(1).add(3);
    }
    return courses.filter((c) => allowedDays.has(c.dayOfWeek) && typeFilter.has(c.colorTag));
  },

  getConflicts: () => {
    const { courses } = get();
    const conflicts = new Set<string>();
    const map = new Map<string, Course[]>();
    for (const c of courses) {
      for (let s = c.startSlot; s < c.startSlot + c.duration; s++) {
        const key = `${c.dayOfWeek}-${s}-${c.weekType === 'all' ? 'x' : c.weekType}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(c);
      }
      const allKey = `${c.dayOfWeek}-all`;
      if (!map.has(allKey)) map.set(allKey, []);
      map.get(allKey)!.push(c);
    }
    for (const list of map.values()) {
      const unique = Array.from(new Set(list.map((c) => c.id)));
      if (unique.length > 1) {
        for (const id of unique) conflicts.add(id);
      }
    }
    for (let d = 0; d < 7; d++) {
      const dayCourses = courses.filter((c) => c.dayOfWeek === d);
      for (let i = 0; i < dayCourses.length; i++) {
        for (let j = i + 1; j < dayCourses.length; j++) {
          const a = dayCourses[i];
          const b = dayCourses[j];
          const weekOverlap =
            a.weekType === 'all' ||
            b.weekType === 'all' ||
            a.weekType === b.weekType;
          if (!weekOverlap) continue;
          const overlap =
            a.startSlot < b.startSlot + b.duration && b.startSlot < a.startSlot + a.duration;
          if (overlap) {
            conflicts.add(a.id);
            conflicts.add(b.id);
          }
        }
      }
    }
    return conflicts;
  },
}));
