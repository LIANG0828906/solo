import axiosInstance, { request } from '@/hooks/useApi'
import type {
  Question,
  QuestionCreateDto,
  QuestionUpdateDto,
  QuestionQueryParams,
} from '@shared/types'

export async function fetchQuestions(params?: QuestionQueryParams): Promise<Question[]> {
  return request<Question[]>({
    method: 'GET',
    url: '/questions',
    params,
  })
}

export async function fetchQuestion(id: string): Promise<Question> {
  return request<Question>({
    method: 'GET',
    url: `/questions/${id}`,
  })
}

export async function createQuestion(data: QuestionCreateDto): Promise<Question> {
  return request<Question>({
    method: 'POST',
    url: '/questions',
    data,
  })
}

export async function updateQuestion(
  id: string,
  data: QuestionUpdateDto,
): Promise<Question> {
  return request<Question>({
    method: 'PUT',
    url: `/questions/${id}`,
    data,
  })
}

export async function deleteQuestion(id: string): Promise<void> {
  await axiosInstance.delete(`/questions/${id}`)
}
