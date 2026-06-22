import axios from 'axios';

export interface SearchResult {
  id: string;
  title: string;
  author: string;
  cover: string;
}

export interface SummaryRequest {
  bookId: string;
  title: string;
  author: string;
}

export interface SummaryResponse {
  summary: string;
}

const api = axios.create({
  baseURL: '/',
  timeout: 10000,
});

export const searchBooks = async (query: string): Promise<SearchResult[]> => {
  const response = await api.get('/api/search', {
    params: { query },
  });
  return response.data;
};

export const generateSummary = async (
  data: SummaryRequest
): Promise<SummaryResponse> => {
  const response = await api.post('/api/summary', data);
  return response.data;
};

export default api;
