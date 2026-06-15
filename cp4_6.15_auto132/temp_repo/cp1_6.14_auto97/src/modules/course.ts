import { request } from '@/hooks/useApi'
import type { Course, Chapter } from '@shared/types'

export async function fetchCourses(): Promise<Course[]> {
  return request<Course[]>({
    method: 'GET',
    url: '/courses',
  })
}

export async function createCourse(name: string): Promise<Course> {
  return request<Course>({
    method: 'POST',
    url: '/courses',
    data: { name },
  })
}

export async function updateCourse(id: string, name: string): Promise<Course> {
  return request<Course>({
    method: 'PUT',
    url: `/courses/${id}`,
    data: { name },
  })
}

export async function deleteCourse(id: string): Promise<void> {
  return request<void>({
    method: 'DELETE',
    url: `/courses/${id}`,
  })
}

export async function createChapter(
  courseId: string,
  name: string,
  knowledgePoints: string[] = [],
): Promise<Chapter> {
  return request<Chapter>({
    method: 'POST',
    url: `/courses/${courseId}/chapters`,
    data: { name, knowledgePoints },
  })
}

export async function updateChapter(
  id: string,
  name: string,
  knowledgePoints?: string[],
): Promise<Chapter> {
  return request<Chapter>({
    method: 'PUT',
    url: `/courses/chapters/${id}`,
    data: { name, knowledgePoints },
  })
}

export async function deleteChapter(id: string): Promise<void> {
  return request<void>({
    method: 'DELETE',
    url: `/courses/chapters/${id}`,
  })
}
