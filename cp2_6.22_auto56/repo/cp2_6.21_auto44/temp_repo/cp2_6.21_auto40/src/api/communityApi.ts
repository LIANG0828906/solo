import apiClient from './client';
import type {
  PaginatedBatches,
  PublicBatchDetail,
  Comment,
  CommentCreate,
  TasteNote,
  TasteNoteCreate,
} from '@/types';

export async function listPublicBatches(params: {
  bean_type?: string;
  roast_level?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedBatches> {
  const res = await apiClient.get<PaginatedBatches>('/api/community', { params });
  return res.data;
}

export async function getPublicBatchDetail(id: number): Promise<PublicBatchDetail> {
  const res = await apiClient.get<PublicBatchDetail>(`/api/community/${id}`);
  return res.data;
}

export async function postComment(data: CommentCreate): Promise<Comment> {
  const res = await apiClient.post<Comment>('/api/comments', data);
  return res.data;
}

export async function getComments(batchId: number): Promise<Comment[]> {
  const res = await apiClient.get<Comment[]>(`/api/batches/${batchId}/comments`);
  return res.data;
}

export async function getTasteNotes(batchId: number): Promise<TasteNote[]> {
  const res = await apiClient.get<TasteNote[]>(`/api/batches/${batchId}/taste-notes`);
  return res.data;
}

export async function postTasteNote(data: TasteNoteCreate): Promise<TasteNote> {
  const res = await apiClient.post<TasteNote>('/api/taste-notes', data);
  return res.data;
}
