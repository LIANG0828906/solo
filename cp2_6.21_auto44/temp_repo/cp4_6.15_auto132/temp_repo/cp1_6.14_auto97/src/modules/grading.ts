import { request } from '@/hooks/useApi'
import type { GradingResult, ManualGradeDto } from '@shared/types'

export async function autoGrade(submissionId: string): Promise<GradingResult> {
  return request<GradingResult>({
    method: 'POST',
    url: '/grading/auto-grade',
    data: { submissionId },
  })
}

export async function manualGrade(
  submissionId: string,
  questionId: string,
  score: number,
  comment?: string,
): Promise<GradingResult> {
  const data: ManualGradeDto = {
    submissionId,
    questionId,
    score,
    comment,
  }
  return request<GradingResult>({
    method: 'POST',
    url: '/grading/manual-grade',
    data,
  })
}
