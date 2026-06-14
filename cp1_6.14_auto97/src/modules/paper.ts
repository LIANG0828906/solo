import { request } from '@/hooks/useApi'
import type {
  Paper,
  PaperCreateDto,
  Submission,
  SubmissionCreateDto,
} from '@shared/types'

export async function fetchPapers(): Promise<Paper[]> {
  return request<Paper[]>({
    method: 'GET',
    url: '/papers',
  })
}

export async function fetchPaper(id: string): Promise<Paper> {
  return request<Paper>({
    method: 'GET',
    url: `/papers/${id}`,
  })
}

export async function createPaper(data: PaperCreateDto): Promise<Paper> {
  return request<Paper>({
    method: 'POST',
    url: '/papers',
    data,
  })
}

export async function submitAnswer(data: SubmissionCreateDto): Promise<Submission> {
  return request<Submission>({
    method: 'POST',
    url: '/submissions',
    data,
  })
}

export async function fetchSubmissions(paperId?: string): Promise<Submission[]> {
  return request<Submission[]>({
    method: 'GET',
    url: '/submissions',
    params: paperId ? { paperId } : undefined,
  })
}

export async function fetchSubmission(id: string): Promise<Submission> {
  return request<Submission>({
    method: 'GET',
    url: `/submissions/${id}`,
  })
}
