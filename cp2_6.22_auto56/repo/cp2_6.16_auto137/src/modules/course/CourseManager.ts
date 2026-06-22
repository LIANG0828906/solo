import { v4 as uuidv4 } from 'uuid'
import type { Course } from '@/types'
import { courseDB, studentDB, attendanceDB, taskDB, submissionDB, practiceDB } from '@/utils/db'
import { useStore } from '@/store/useStore'

export class CourseManager {
  static async loadAll(): Promise<Course[]> {
    const courses = await courseDB.getAll()
    useStore.getState().setCourses(courses.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
    return courses
  }

  static async create(data: Omit<Course, 'id' | 'createdAt'>): Promise<Course> {
    const course: Course = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }
    await courseDB.set(course.id, course)
    useStore.getState().addCourse(course)
    return course
  }

  static async update(id: string, data: Partial<Omit<Course, 'id' | 'createdAt'>>): Promise<Course | null> {
    const existing = await courseDB.getById(id)
    if (!existing) return null
    
    const updated: Course = { ...existing, ...data }
    await courseDB.set(id, updated)
    useStore.getState().updateCourse(updated)
    return updated
  }

  static async delete(id: string): Promise<boolean> {
    const students = await studentDB.getByCourseId(id)
    const attendances = await attendanceDB.getByCourseId(id)
    const tasks = await taskDB.getByCourseId(id)
    const submissions = await submissionDB.getAll()
    const taskIds = tasks.map(t => t.id)
    const relatedSubmissions = submissions.filter(s => taskIds.includes(s.taskId))

    for (const student of students) {
      const records = await practiceDB.getByStudentId(student.id)
      for (const record of records) {
        await practiceDB.delete(record.id)
      }
      for (const attendance of attendances.filter(a => a.studentId === student.id)) {
        await attendanceDB.delete(attendance.id)
      }
      for (const submission of relatedSubmissions.filter(s => s.studentId === student.id)) {
        await submissionDB.delete(submission.id)
      }
      await studentDB.delete(student.id)
    }

    for (const task of tasks) {
      await taskDB.delete(task.id)
    }

    await courseDB.delete(id)
    useStore.getState().deleteCourse(id)
    return true
  }

  static getCourseIds(): string[] {
    return useStore.getState().courses.map(c => c.id)
  }

  static getById(id: string): Course | undefined {
    return useStore.getState().courses.find(c => c.id === id)
  }

  static getByStudentId(studentId: string): Course | undefined {
    const student = useStore.getState().students.find(s => s.id === studentId)
    if (!student) return undefined
    return useStore.getState().courses.find(c => c.id === student.courseId)
  }
}
