import { create } from 'zustand'
import type { Course, Student, Attendance, Task, TaskSubmission, PracticeRecord } from '@/types'

interface AppState {
  courses: Course[]
  students: Student[]
  attendances: Attendance[]
  tasks: Task[]
  submissions: TaskSubmission[]
  practiceRecords: PracticeRecord[]
  currentCourseId: string | null
  currentStudentId: string | null
  sidebarOpen: boolean
  isLoading: boolean
  
  setCourses: (courses: Course[]) => void
  setStudents: (students: Student[]) => void
  setAttendances: (attendances: Attendance[]) => void
  setTasks: (tasks: Task[]) => void
  setSubmissions: (submissions: TaskSubmission[]) => void
  setPracticeRecords: (records: PracticeRecord[]) => void
  setCurrentCourseId: (id: string | null) => void
  setCurrentStudentId: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setIsLoading: (loading: boolean) => void
  
  addCourse: (course: Course) => void
  updateCourse: (course: Course) => void
  deleteCourse: (id: string) => void
  
  addStudent: (student: Student) => void
  updateStudent: (student: Student) => void
  deleteStudent: (id: string) => void
  
  addAttendance: (attendance: Attendance) => void
  updateAttendance: (attendance: Attendance) => void
  
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  deleteTask: (id: string) => void
  
  addSubmission: (submission: TaskSubmission) => void
  updateSubmission: (submission: TaskSubmission) => void
  
  addPracticeRecord: (record: PracticeRecord) => void
  updatePracticeRecord: (record: PracticeRecord) => void
}

export const useStore = create<AppState>((set) => ({
  courses: [],
  students: [],
  attendances: [],
  tasks: [],
  submissions: [],
  practiceRecords: [],
  currentCourseId: null,
  currentStudentId: null,
  sidebarOpen: true,
  isLoading: false,

  setCourses: (courses) => set({ courses }),
  setStudents: (students) => set({ students }),
  setAttendances: (attendances) => set({ attendances }),
  setTasks: (tasks) => set({ tasks }),
  setSubmissions: (submissions) => set({ submissions }),
  setPracticeRecords: (practiceRecords) => set({ practiceRecords }),
  setCurrentCourseId: (currentCourseId) => set({ currentCourseId }),
  setCurrentStudentId: (currentStudentId) => set({ currentStudentId }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setIsLoading: (isLoading) => set({ isLoading }),

  addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
  updateCourse: (course) => set((state) => ({
    courses: state.courses.map(c => c.id === course.id ? course : c)
  })),
  deleteCourse: (id) => set((state) => ({
    courses: state.courses.filter(c => c.id !== id)
  })),

  addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
  updateStudent: (student) => set((state) => ({
    students: state.students.map(s => s.id === student.id ? student : s)
  })),
  deleteStudent: (id) => set((state) => ({
    students: state.students.filter(s => s.id !== id)
  })),

  addAttendance: (attendance) => set((state) => ({ attendances: [...state.attendances, attendance] })),
  updateAttendance: (attendance) => set((state) => ({
    attendances: state.attendances.map(a => a.id === attendance.id ? attendance : a)
  })),

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map(t => t.id === task.id ? task : t)
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id)
  })),

  addSubmission: (submission) => set((state) => ({ submissions: [...state.submissions, submission] })),
  updateSubmission: (submission) => set((state) => ({
    submissions: state.submissions.map(s => s.id === submission.id ? submission : s)
  })),

  addPracticeRecord: (record) => set((state) => ({ practiceRecords: [...state.practiceRecords, record] })),
  updatePracticeRecord: (record) => set((state) => ({
    practiceRecords: state.practiceRecords.map(p => p.id === record.id ? record : p)
  })),
}))
