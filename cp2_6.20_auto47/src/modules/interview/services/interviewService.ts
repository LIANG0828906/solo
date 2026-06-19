import axios from 'axios';
import type { InterviewSession, GenerateQuestionsRequest, SubmitAnswerRequest, QuestionFeedback } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const interviewService = {
  async generateQuestions(request: GenerateQuestionsRequest): Promise<InterviewSession> {
    const { data } = await api.post<InterviewSession>('/interviews/generate', request);
    return data;
  },

  async submitAnswer(
    request: SubmitAnswerRequest,
  ): Promise<{ session: InterviewSession; feedback: QuestionFeedback }> {
    const { data } = await api.post<{ session: InterviewSession; feedback: QuestionFeedback }>(
      `/interviews/${request.sessionId}/answer`,
      { questionId: request.questionId, answer: request.answer, duration: request.duration },
    );
    return data;
  },

  async getSession(id: string): Promise<InterviewSession> {
    const { data } = await api.get<InterviewSession>(`/interviews/${id}`);
    return data;
  },

  async getHistory(): Promise<InterviewSession[]> {
    const { data } = await api.get<InterviewSession[]>('/interviews/history');
    return data;
  },
};
