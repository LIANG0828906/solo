import { request } from '@/hooks/useApi'
import type { WeakPoint, Question } from '@shared/types'

export async function fetchWeakPoints(studentName: string): Promise<WeakPoint[]> {
  return request<WeakPoint[]>({
    method: 'GET',
    url: '/analysis/weak-points',
    params: { studentName },
  })
}

export async function fetchRecommendQuestions(
  studentName: string,
  knowledgePoint?: string,
): Promise<Question[]> {
  return request<Question[]>({
    method: 'GET',
    url: '/analysis/recommend-questions',
    params: { studentName, knowledgePoint },
  })
}
