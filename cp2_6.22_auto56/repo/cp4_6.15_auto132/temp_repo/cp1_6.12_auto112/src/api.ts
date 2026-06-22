import axios from 'axios';
import type { CodeSnippet, Comment, Language } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const getLanguages = (): Promise<Language[]> => {
  return api.get('/languages').then(res => res.data);
};

export const getSnippets = (params?: {
  language?: string;
  tag?: string;
  search?: string;
}): Promise<CodeSnippet[]> => {
  return api.get('/snippets', { params }).then(res => res.data);
};

export const getSnippet = (id: string): Promise<CodeSnippet> => {
  return api.get(`/snippets/${id}`).then(res => res.data);
};

export const createSnippet = (data: {
  code: string;
  language: string;
  description?: string;
  tags?: string[];
  title?: string;
}): Promise<CodeSnippet> => {
  return api.post('/snippets', data).then(res => res.data);
};

export const toggleLike = (id: string): Promise<{ likes: number; liked: boolean }> => {
  return api.post(`/snippets/${id}/like`).then(res => res.data);
};

export const getComments = (snippetId: string): Promise<Comment[]> => {
  return api.get(`/snippets/${snippetId}/comments`).then(res => res.data);
};

export const addComment = (
  snippetId: string,
  data: { content: string; parentId?: string }
): Promise<Comment> => {
  return api.post(`/snippets/${snippetId}/comments`, data).then(res => res.data);
};

export const getTags = (): Promise<string[]> => {
  return api.get('/tags').then(res => res.data);
};

export default api;
