import { get, set, del, keys } from 'idb-keyval';
import type { Course, Student, Assignment, PracticeRecord, User } from '@/types';

const DB_KEYS = {
  COURSES: 'tunetracker_courses',
  STUDENTS: 'tunetracker_students',
  ASSIGNMENTS: 'tunetracker_assignments',
  PRACTICE_RECORDS: 'tunetracker_practice_records',
  CURRENT_USER: 'tunetracker_current_user',
};

export const db = {
  async getCourses(): Promise<Course[]> {
    const data = await get<Course[]>(DB_KEYS.COURSES);
    return data || [];
  },

  async setCourses(courses: Course[]): Promise<void> {
    await set(DB_KEYS.COURSES, courses);
  },

  async getStudents(): Promise<Student[]> {
    const data = await get<Student[]>(DB_KEYS.STUDENTS);
    return data || [];
  },

  async setStudents(students: Student[]): Promise<void> {
    await set(DB_KEYS.STUDENTS, students);
  },

  async getAssignments(): Promise<Assignment[]> {
    const data = await get<Assignment[]>(DB_KEYS.ASSIGNMENTS);
    return data || [];
  },

  async setAssignments(assignments: Assignment[]): Promise<void> {
    await set(DB_KEYS.ASSIGNMENTS, assignments);
  },

  async getPracticeRecords(): Promise<PracticeRecord[]> {
    const data = await get<PracticeRecord[]>(DB_KEYS.PRACTICE_RECORDS);
    return data || [];
  },

  async setPracticeRecords(records: PracticeRecord[]): Promise<void> {
    await set(DB_KEYS.PRACTICE_RECORDS, records);
  },

  async getCurrentUser(): Promise<User | null> {
    const data = await get<User>(DB_KEYS.CURRENT_USER);
    return data || null;
  },

  async setCurrentUser(user: User): Promise<void> {
    await set(DB_KEYS.CURRENT_USER, user);
  },

  async clearAll(): Promise<void> {
    const allKeys = await keys();
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith('tunetracker_')) {
        await del(key);
      }
    }
  },
};
