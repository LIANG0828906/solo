import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Student,
  Course,
  PracticeRecord,
  Assignment,
  CourseConflictResult,
} from '@/types';
import { db } from '@/utils/db';
import {
  mockStudents,
  mockCourses,
  mockPracticeRecords,
  mockAssignments,
  mockTeacher,
} from '@/utils/mockData';

interface StoreState {
  currentUser: User | null;
  students: Student[];
  courses: Course[];
  practiceRecords: PracticeRecord[];
  assignments: Assignment[];
  isInitialized: boolean;

  initStore: () => Promise<void>;
  switchUser: (user: User) => Promise<void>;

  addCourse: (course: Omit<Course, 'id'>) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  checkCourseConflict: (
    startTime: string,
    duration: number,
    excludeId?: string
  ) => CourseConflictResult;

  addStudent: (student: Omit<Student, 'id'>) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  addPracticeRecord: (
    record: Omit<PracticeRecord, 'id'>
  ) => Promise<PracticeRecord>;
  deletePracticeRecord: (id: string) => Promise<void>;

  addAssignment: (
    assignment: Omit<Assignment, 'id' | 'createdAt' | 'status'>
  ) => Promise<Assignment>;
  submitAssignment: (id: string) => Promise<void>;
  reviewAssignment: (
    id: string,
    status: 'approved' | 'rejected',
    feedback: string
  ) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  currentUser: null,
  students: [],
  courses: [],
  practiceRecords: [],
  assignments: [],
  isInitialized: false,

  initStore: async () => {
    try {
      const [students, courses, practiceRecords, assignments, currentUser] =
        await Promise.all([
          db.getStudents(),
          db.getCourses(),
          db.getPracticeRecords(),
          db.getAssignments(),
          db.getCurrentUser(),
        ]);

      if (students.length === 0) {
        await db.setStudents(mockStudents);
        await db.setCourses(mockCourses);
        await db.setPracticeRecords(mockPracticeRecords);
        await db.setAssignments(mockAssignments);
        await db.setCurrentUser(mockTeacher);

        set({
          students: mockStudents,
          courses: mockCourses,
          practiceRecords: mockPracticeRecords,
          assignments: mockAssignments,
          currentUser: mockTeacher,
          isInitialized: true,
        });
      } else {
        set({
          students,
          courses,
          practiceRecords,
          assignments,
          currentUser,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isInitialized: true });
    }
  },

  switchUser: async (user: User) => {
    await db.setCurrentUser(user);
    set({ currentUser: user });
  },

  addCourse: async (course) => {
    const newCourse: Course = {
      ...course,
      id: `course-${uuidv4().slice(0, 8)}`,
    };
    const courses = [...get().courses, newCourse];
    await db.setCourses(courses);
    set({ courses });
    return newCourse;
  },

  updateCourse: async (id, updates) => {
    const courses = get().courses.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    await db.setCourses(courses);
    set({ courses });
  },

  deleteCourse: async (id) => {
    const courses = get().courses.filter((c) => c.id !== id);
    await db.setCourses(courses);
    set({ courses });
  },

  checkCourseConflict: (startTime, duration, excludeId) => {
    const start = new Date(startTime).getTime();
    const end = start + duration * 60 * 1000;
    const teacherId = get().currentUser?.id || '';

    const conflictingCourse = get().courses.find((course) => {
      if (excludeId && course.id === excludeId) return false;
      if (course.teacherId !== teacherId) return false;

      const courseStart = new Date(course.startTime).getTime();
      const courseEnd = courseStart + course.duration * 60 * 1000;

      return start < courseEnd && end > courseStart;
    });

    return {
      hasConflict: !!conflictingCourse,
      conflictingCourse,
    };
  },

  addStudent: async (student) => {
    const newStudent: Student = {
      ...student,
      id: `student-${uuidv4().slice(0, 8)}`,
    };
    const students = [...get().students, newStudent];
    await db.setStudents(students);
    set({ students });
    return newStudent;
  },

  updateStudent: async (id, updates) => {
    const students = get().students.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    await db.setStudents(students);
    set({ students });
  },

  deleteStudent: async (id) => {
    const students = get().students.filter((s) => s.id !== id);
    await db.setStudents(students);
    set({ students });
  },

  addPracticeRecord: async (record) => {
    const newRecord: PracticeRecord = {
      ...record,
      id: `practice-${uuidv4().slice(0, 8)}`,
    };
    const practiceRecords = [newRecord, ...get().practiceRecords];
    await db.setPracticeRecords(practiceRecords);
    set({ practiceRecords });
    return newRecord;
  },

  deletePracticeRecord: async (id) => {
    const practiceRecords = get().practiceRecords.filter((r) => r.id !== id);
    await db.setPracticeRecords(practiceRecords);
    set({ practiceRecords });
  },

  addAssignment: async (assignment) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: `assignment-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    const assignments = [...get().assignments, newAssignment];
    await db.setAssignments(assignments);
    set({ assignments });
    return newAssignment;
  },

  submitAssignment: async (id) => {
    const assignments = get().assignments.map((a) =>
      a.id === id
        ? { ...a, status: 'submitted' as const, submittedAt: new Date().toISOString() }
        : a
    );
    await db.setAssignments(assignments);
    set({ assignments });
  },

  reviewAssignment: async (id, status, feedback) => {
    const assignments = get().assignments.map((a) =>
      a.id === id ? { ...a, status, feedback } : a
    );
    await db.setAssignments(assignments);
    set({ assignments });
  },

  deleteAssignment: async (id) => {
    const assignments = get().assignments.filter((a) => a.id !== id);
    await db.setAssignments(assignments);
    set({ assignments });
  },
}));
