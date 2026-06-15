import { Diary, DiaryFormData, Comment, PaginatedDiaries, GrammarSuggestion, LikeStatus } from '../../shared/types';

export async function fetchDiaries(page: number, pageSize: number, language?: string, level?: string): Promise<PaginatedDiaries> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (language) params.append('language', language);
  if (level) params.append('level', level);
  const res = await fetch(`/api/diaries?${params}`);
  return res.json();
}

export async function fetchDiary(id: string): Promise<Diary> {
  const res = await fetch(`/api/diaries/${id}`);
  return res.json();
}

export async function createDiary(data: DiaryFormData): Promise<Diary> {
  const res = await fetch('/api/diaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return res.json();
}

export async function fetchComments(diaryId: string): Promise<Comment[]> {
  const res = await fetch(`/api/diaries/${diaryId}/comments`);
  return res.json();
}

export async function addComment(diaryId: string, userId: string, username: string, content: string): Promise<Comment> {
  const res = await fetch(`/api/diaries/${diaryId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, username, content }) });
  return res.json();
}

export async function checkLike(diaryId: string, userId: string): Promise<LikeStatus> {
  const res = await fetch(`/api/diaries/${diaryId}/like?userId=${userId}`);
  return res.json();
}

export async function toggleLike(diaryId: string, userId: string): Promise<LikeStatus> {
  const res = await fetch(`/api/diaries/${diaryId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
  return res.json();
}

export async function grammarCheck(content: string, language: string, level: string): Promise<{ suggestions: GrammarSuggestion[] }> {
  const res = await fetch('/api/grammar-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, language, level }) });
  return res.json();
}
