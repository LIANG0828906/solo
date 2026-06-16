import { get, set, del, keys } from 'idb-keyval'
import type { Course, Student, Attendance, Task, TaskSubmission, PracticeRecord } from '@/types'

const DB_PREFIX = 'music_academy_'

const makeKey = (type: string, id: string) => `${DB_PREFIX}${type}_${id}`
const makeTypePrefix = (type: string) => `${DB_PREFIX}${type}_`

export const db = {
  async getAll<T>(type: string): Promise<T[]> {
    const allKeys = await keys()
    const prefix = makeTypePrefix(type)
    const typeKeys = allKeys.filter(k => k.toString().startsWith(prefix))
    const items = await Promise.all(typeKeys.map(k => get(k)))
    return items.filter(Boolean) as T[]
  },

  async getById<T>(type: string, id: string): Promise<T | undefined> {
    return get(makeKey(type, id))
  },

  async set<T>(type: string, id: string, data: T): Promise<void> {
    await set(makeKey(type, id), data)
  },

  async delete(type: string, id: string): Promise<void> {
    await del(makeKey(type, id))
  },

  async getByForeignKey<T>(type: string, fkName: string, fkValue: string): Promise<T[]> {
    const all = await this.getAll<T>(type)
    return all.filter(item => (item as Record<string, unknown>)[fkName] === fkValue)
  },
}

export const courseDB = {
  getAll: () => db.getAll<Course>('course'),
  getById: (id: string) => db.getById<Course>('course', id),
  set: (id: string, data: Course) => db.set('course', id, data),
  delete: (id: string) => db.delete('course', id),
}

export const studentDB = {
  getAll: () => db.getAll<Student>('student'),
  getById: (id: string) => db.getById<Student>('student', id),
  set: (id: string, data: Student) => db.set('student', id, data),
  delete: (id: string) => db.delete('student', id),
  getByCourseId: (courseId: string) => db.getByForeignKey<Student>('student', 'courseId', courseId),
}

export const attendanceDB = {
  getAll: () => db.getAll<Attendance>('attendance'),
  getById: (id: string) => db.getById<Attendance>('attendance', id),
  set: (id: string, data: Attendance) => db.set('attendance', id, data),
  delete: (id: string) => db.delete('attendance', id),
  getByCourseId: (courseId: string) => db.getByForeignKey<Attendance>('attendance', 'courseId', courseId),
  getByStudentId: (studentId: string) => db.getByForeignKey<Attendance>('attendance', 'studentId', studentId),
}

export const taskDB = {
  getAll: () => db.getAll<Task>('task'),
  getById: (id: string) => db.getById<Task>('task', id),
  set: (id: string, data: Task) => db.set('task', id, data),
  delete: (id: string) => db.delete('task', id),
  getByCourseId: (courseId: string) => db.getByForeignKey<Task>('task', 'courseId', courseId),
}

export const submissionDB = {
  getAll: () => db.getAll<TaskSubmission>('submission'),
  getById: (id: string) => db.getById<TaskSubmission>('submission', id),
  set: (id: string, data: TaskSubmission) => db.set('submission', id, data),
  delete: (id: string) => db.delete('submission', id),
  getByTaskId: (taskId: string) => db.getByForeignKey<TaskSubmission>('submission', 'taskId', taskId),
  getByStudentId: (studentId: string) => db.getByForeignKey<TaskSubmission>('submission', 'studentId', studentId),
}

export const practiceDB = {
  getAll: () => db.getAll<PracticeRecord>('practice'),
  getById: (id: string) => db.getById<PracticeRecord>('practice', id),
  set: (id: string, data: PracticeRecord) => db.set('practice', id, data),
  delete: (id: string) => db.delete('practice', id),
  getByStudentId: (studentId: string) => db.getByForeignKey<PracticeRecord>('practice', 'studentId', studentId),
}
