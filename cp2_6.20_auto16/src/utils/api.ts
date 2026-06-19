import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const poemApi = {
  create: (data: { title: string; authorId: string; collectionId?: string }) =>
    api.post('/poems', data),
  get: (id: string) => api.get(`/poems/${id}`),
  update: (id: string, data: { title?: string; lines?: unknown[]; collectionId?: string | null }) =>
    api.put(`/poems/${id}`, data),
  delete: (id: string) => api.delete(`/poems/${id}`),
  checkTonal: (id: string) => api.post(`/poems/${id}/check-tonal`),
  list: (authorId?: string) => api.get('/poems', { params: { authorId } }),
  like: (id: string) => api.post(`/poems/${id}/like`),
};

export const annotationApi = {
  create: (poemId: string, data: { lineId: string; authorId: string; startOffset: number; endOffset: number; highlightedText: string; content: string }) =>
    api.post(`/poems/${poemId}/annotations`, data),
  list: (poemId: string) => api.get(`/poems/${poemId}/annotations`),
  reply: (poemId: string, annotationId: string, data: { authorId: string; content: string }) =>
    api.post(`/poems/${poemId}/annotations/${annotationId}/replies`, data),
};

export const collaboratorApi = {
  invite: (poemId: string, data: { email: string }) =>
    api.post(`/poems/${poemId}/invite`, data),
  list: (poemId: string) => api.get(`/poems/${poemId}/collaborators`),
};

export const inspirationApi = {
  list: () => api.get('/inspirations'),
  create: (data: { content: string }) => api.post('/inspirations', data),
  update: (id: string, data: { starred?: boolean; content?: string }) =>
    api.put(`/inspirations/${id}`, data),
  delete: (id: string) => api.delete(`/inspirations/${id}`),
};

export const collectionApi = {
  list: () => api.get('/collections'),
  create: (data: { name: string; description?: string }) => api.post('/collections', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/collections/${id}`, data),
  delete: (id: string) => api.delete(`/collections/${id}`),
};

export const portfolioApi = {
  getTimeline: (userId: string) => api.get(`/portfolio/${userId}`),
  getComments: (poemId: string) => api.get(`/poems/${poemId}/comments`),
  addComment: (poemId: string, data: { userId: string; content: string }) =>
    api.post(`/poems/${poemId}/comments`, data),
};

export default api;
