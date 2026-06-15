import { useState, useEffect, useCallback } from 'react'
import { loadCourses, addCourse, enrollStudent, Course, AddCourseResponse, ApiResponse } from '../api'

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    const response = await loadCourses()
    if (response.success && response.data) {
      setCourses(response.data)
    } else {
      setError(response.message || '加载课程失败')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const addNewCourse = useCallback(
    async (courseData: Omit<Course, 'id' | 'enrolledCount'> & { force?: boolean }): Promise<AddCourseResponse> => {
      const response = await addCourse(courseData)
      if (response.success && response.data && 'id' in response.data) {
        setCourses((prev) => [...prev, response.data as Course])
      }
      return response
    },
    [],
  )

  const enrollInCourse = useCallback(async (courseId: string, studentName: string) => {
    const response = await enrollStudent(courseId, studentName)
    if (response.success && response.data) {
      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? response.data! : course)),
      )
    }
    return response
  }, [])

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
    addCourse: addNewCourse,
    enrollInCourse,
  }
}
