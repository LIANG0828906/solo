import { request } from '@/hooks/useApi'
import type { Submission, ManualGradeDto } from '@shared/types'

export async function autoGrade(submissionId: string): Promise<Submission> {
  return request<Submission>({
    method: 'POST',
    url: `/grading/auto/${submissionId}`,
  })
}

export async function manualGrade(
  submissionId: string,
  questionId: string,
  score: number,
  comment?: string,
): Promise<Submission> {
  const data: ManualGradeDto = {
    submissionId,
    questionId,
    score,
    comment,
  }
  return request<Submission>({
    method: 'POST',
    url: '/grading/manual',
    data,
  })
}
