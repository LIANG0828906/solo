import axios from 'axios';
import type { CodeSnippet, PaginationResult } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const snippetsApi = {
  getAll: (page: number = 1, pageSize: number = 12): Promise<PaginationResult<CodeSnippet>> => {
    return api.get('/snippets', { params: { page, pageSize } }).then((res) => res.data);
  },

  search: (
    keyword: string,
    tags: string[],
    page: number = 1,
    pageSize: number = 12
  ): Promise<PaginationResult<CodeSnippet>> => {
    return api
      .get('/snippets/search', {
        params: {
          keyword,
          tags: tags.join(','),
          page,
          pageSize,
        },
      })
      .then((res) => res.data);
  },

  getById: (id: string): Promise<CodeSnippet> => {
    return api.get(`/snippets/${id}`).then((res) => res.data);
  },

  create: (data: {
    title: string;
    description: string;
    code: string;
    language: string;
    tags: string[];
  }): Promise<CodeSnippet> => {
    return api.post('/snippets', data).then((res) => res.data);
  },

  update: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      code: string;
      language: string;
      tags: string[];
    }>
  ): Promise<CodeSnippet> => {
    return api.put(`/snippets/${id}`, data).then((res) => res.data);
  },

  delete: (id: string): Promise<void> => {
    return api.delete(`/snippets/${id}`).then((res) => res.data);
  },

  toggleFavorite: (id: string): Promise<{ snippet: CodeSnippet; favorited: boolean }> => {
    return api.post(`/snippets/${id}/favorite`).then((res) => res.data);
  },

  generateShortLink: (id: string): Promise<{ shortCode: string; shortLink: string }> => {
    return api.post(`/snippets/${id}/shortlink`).then((res) => res.data);
  },

  getByShortCode: (shortCode: string): Promise<{ redirect: string; snippet: CodeSnippet }> => {
    return api.get(`/s/${shortCode}`).then((res) => res.data);
  },
};

export const tagsApi = {
  getAll: (): Promise<string[]> => {
    return api.get('/tags').then((res) => res.data);
  },
};

export default api;
