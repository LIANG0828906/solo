import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  description: string;
  code: string;
  folderId: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  count?: number;
}

export const getCodes = () => api.get<CodeSnippet[]>('/codes').then(r => r.data);

export const getCodeById = (id: string) => api.get<CodeSnippet>(`/codes/${id}`).then(r => r.data);

export const createCode = (data: Partial<CodeSnippet>) => api.post<CodeSnippet>('/codes', data).then(r => r.data);

export const updateCode = (id: string, data: Partial<CodeSnippet>) => api.put<CodeSnippet>(`/codes/${id}`, data).then(r => r.data);

export const deleteCode = (id: string) => api.delete(`/codes/${id}`).then(r => r.data);

export const getFolders = () => api.get<Folder[]>('/folders').then(r => r.data);

export const createFolder = (data: Partial<Folder>) => api.post<Folder>('/folders', data).then(r => r.data);

export const updateFolder = (id: string, data: Partial<Folder>) => api.put<Folder>(`/folders/${id}`, data).then(r => r.data);

export const deleteFolder = (id: string) => api.delete(`/folders/${id}`).then(r => r.data);
