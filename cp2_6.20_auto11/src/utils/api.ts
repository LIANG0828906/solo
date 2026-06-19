import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export interface Question {
  id: string;
  type: 'choice' | 'multi_choice' | 'fill_blank' | 'true_false';
  difficulty: number;
  knowledge_tag: string;
  stem: string;
  options?: string[];
  answer: string | string[];
  explanation: string;
  created_at: string;
}

export interface GenerateRequest {
  question_type: 'choice' | 'multi_choice' | 'fill_blank' | 'true_false';
  difficulty: number;
  count: number;
  knowledge_tags: string[];
}

export interface GenerateResponse {
  questions: Question[];
}

export interface QuizRecord {
  id: string;
  question: Question;
  added_at: string;
}

export interface PracticeResult {
  total: number;
  correct: number;
  duration: number;
  by_type: Record<string, { total: number; correct: number }>;
}

export async function generateQuestions(req: GenerateRequest): Promise<GenerateResponse> {
  const { data } = await api.post<GenerateResponse>('/generate', req);
  return data;
}

export async function getQuizRecords(): Promise<QuizRecord[]> {
  const { data } = await api.get<QuizRecord[]>('/quiz');
  return data;
}

export async function addQuizRecord(record: QuizRecord): Promise<{ success: boolean }> {
  const { data } = await api.post<{ success: boolean }>('/quiz', record);
  return data;
}

export async function updateQuizRecord(id: string, question: Partial<Question>): Promise<{ success: boolean }> {
  const { data } = await api.put<{ success: boolean }>(`/quiz/${id}`, question);
  return data;
}

export async function deleteQuizRecord(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/quiz/${id}`);
  return data;
}

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  choice: '单选题',
  multi_choice: '多选题',
  fill_blank: '填空题',
  true_false: '判断题',
};

export const KNOWLEDGE_TAGS = [
  '数学', '语文', '英语', '物理', '化学', '生物',
  '历史', '地理', '政治', '编程', '逻辑推理',
];
