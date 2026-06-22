export interface Course {
  id: string
  name: string
  instructor: string
  date: string
  startTime: string
  endTime: string
  maxStudents: number
  description: string
  enrolledCount: number
}

export interface Student {
  id: string
  name: string
  courseIds: string[]
}

export interface ConflictCheckResult {
  hasConflict: boolean
  conflictCourses: Course[]
}

export interface ConflictErrorData {
  conflictCourses: Course[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export type AddCourseResponse = ApiResponse<Course> & {
  success: boolean
  data?: Course | ConflictErrorData
}

const BASE_URL = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    })
    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, message: '网络请求失败' }
  }
}

export async function loadCourses(): Promise<ApiResponse<Course[]>> {
  return request<Course[]>('/courses')
}

export async function addCourse(
  courseData: Omit<Course, 'id' | 'enrolledCount'> & { force?: boolean },
): Promise<AddCourseResponse> {
  return request<Course>('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  }) as Promise<AddCourseResponse>
}

export async function checkConflict(
  courseData: Omit<Course, 'id' | 'enrolledCount'>,
): Promise<ApiResponse<ConflictCheckResult>> {
  return request<ConflictCheckResult>('/courses/check-conflict', {
    method: 'POST',
    body: JSON.stringify(courseData),
  })
}

export async function enrollStudent(
  courseId: string,
  studentName: string,
): Promise<ApiResponse<Course>> {
  return request<Course>(`/courses/${courseId}/enroll`, {
    method: 'POST',
    body: JSON.stringify({ studentName }),
  })
}

export async function loadStudents(): Promise<ApiResponse<Student[]>> {
  return request<Student[]>('/students')
}

export async function loadCourseStudents(courseId: string): Promise<ApiResponse<Student[]>> {
  return request<Student[]>(`/courses/${courseId}/students`)
}
