import { v4 as uuidv4 } from 'uuid'
import type { Student, Attendance, AttendanceStatus } from '@/types'
import { studentDB, attendanceDB } from '@/utils/db'
import { useStore } from '@/store/useStore'
import { CourseManager } from '@/modules/course/CourseManager'

export class StudentManager {
  static async loadAll(): Promise<Student[]> {
    const students = await studentDB.getAll()
    useStore.getState().setStudents(students)
    return students
  }

  static async loadAttendances(): Promise<Attendance[]> {
    const attendances = await attendanceDB.getAll()
    useStore.getState().setAttendances(attendances)
    return attendances
  }

  static async create(data: Omit<Student, 'id'>): Promise<Student> {
    const courseIds = CourseManager.getCourseIds()
    if (!courseIds.includes(data.courseId)) {
      throw new Error('Invalid course ID')
    }

    const student: Student = {
      ...data,
      id: uuidv4(),
    }
    await studentDB.set(student.id, student)
    useStore.getState().addStudent(student)
    return student
  }

  static async update(id: string, data: Partial<Omit<Student, 'id'>>): Promise<Student | null> {
    const existing = await studentDB.getById(id)
    if (!existing) return null
    
    const updated: Student = { ...existing, ...data }
    await studentDB.set(id, updated)
    useStore.getState().updateStudent(updated)
    return updated
  }

  static async delete(id: string): Promise<boolean> {
    const attendances = await attendanceDB.getByStudentId(id)
    for (const attendance of attendances) {
      await attendanceDB.delete(attendance.id)
    }
    await studentDB.delete(id)
    useStore.getState().deleteStudent(id)
    return true
  }

  static getByCourseId(courseId: string): Student[] {
    return useStore.getState().students.filter(s => s.courseId === courseId)
  }

  static getById(id: string): Student | undefined {
    return useStore.getState().students.find(s => s.id === id)
  }

  static async markAttendance(
    studentId: string,
    courseId: string,
    date: string,
    status: AttendanceStatus,
    rating: number = 0
  ): Promise<Attendance> {
    const existing = await this.getAttendance(studentId, courseId, date)
    
    if (existing) {
      const updated: Attendance = { ...existing, status, rating }
      await attendanceDB.set(existing.id, updated)
      useStore.getState().updateAttendance(updated)
      return updated
    }

    const attendance: Attendance = {
      id: uuidv4(),
      studentId,
      courseId,
      date,
      status,
      rating,
    }
    await attendanceDB.set(attendance.id, attendance)
    useStore.getState().addAttendance(attendance)
    return attendance
  }

  static async getAttendance(
    studentId: string,
    courseId: string,
    date: string
  ): Promise<Attendance | undefined> {
    const state = useStore.getState()
    return state.attendances.find(
      a => a.studentId === studentId && a.courseId === courseId && a.date === date
    )
  }

  static getAttendanceRate(studentId: string, courseId: string): number {
    const state = useStore.getState()
    const studentAttendances = state.attendances.filter(
      a => a.studentId === studentId && a.courseId === courseId
    )
    if (studentAttendances.length === 0) return 0
    
    const present = studentAttendances.filter(a => a.status === 'present').length
    return Math.round((present / studentAttendances.length) * 100)
  }

  static getAverageRating(studentId: string, courseId: string): number {
    const state = useStore.getState()
    const ratedAttendances = state.attendances.filter(
      a => a.studentId === studentId && a.courseId === courseId && a.rating > 0
    )
    if (ratedAttendances.length === 0) return 0
    
    const total = ratedAttendances.reduce((sum, a) => sum + a.rating, 0)
    return Math.round((total / ratedAttendances.length) * 10) / 10
  }

  static getCourseAttendanceStats(courseId: string): { present: number; absent: number; unmarked: number } {
    const state = useStore.getState()
    const courseAttendances = state.attendances.filter(a => a.courseId === courseId)
    
    return {
      present: courseAttendances.filter(a => a.status === 'present').length,
      absent: courseAttendances.filter(a => a.status === 'absent').length,
      unmarked: courseAttendances.filter(a => a.status === 'unmarked').length,
    }
  }
}
