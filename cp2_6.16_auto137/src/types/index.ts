export interface Course {
  id: string
  name: string
  description: string
  coverColor: string
  scheduleTime: string
  createdAt: string
}

export interface Student {
  id: string
  courseId: string
  name: string
  age: number
  instrument: string
  startDate: string
}

export interface Attendance {
  id: string
  studentId: string
  courseId: string
  date: string
  status: 'present' | 'absent' | 'unmarked'
  rating: number
}

export interface Task {
  id: string
  courseId: string
  title: string
  description: string
  demoAudio: string
  deadline: string
  createdAt: string
}

export interface TaskSubmission {
  id: string
  taskId: string
  studentId: string
  content: string
  fileUrl: string
  submittedAt: string
  score: number
  feedback: string
}

export interface PracticeRecord {
  id: string
  studentId: string
  date: string
  duration: number
  exercises: string
  teacherComment: string
}

export type AttendanceStatus = 'present' | 'absent' | 'unmarked'
