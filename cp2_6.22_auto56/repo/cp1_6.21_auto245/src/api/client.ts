import axios from 'axios';
import type { Show, SearchResult, ShowDetail, WatchRecord } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const searchShows = async (query: string): Promise<SearchResult[]> => {
  const response = await apiClient.get<ApiResponse<SearchResult[]>>('/search', {
    params: { q: query },
  });
  return response.data.data || [];
};

export const getShows = async (): Promise<Show[]> => {
  const response = await apiClient.get<ApiResponse<Show[]>>('/shows');
  return response.data.data || [];
};

export const addShow = async (show: {
  tmdbId: number;
  name: string;
  posterPath: string;
  firstAirDate: string;
  overview: string;
  genres: string[];
  totalEpisodes: number;
  totalSeasons: number;
}): Promise<Show> => {
  const response = await apiClient.post<ApiResponse<Show>>('/shows', show);
  if (!response.data.data) {
    throw new Error('Failed to add show');
  }
  return response.data.data;
};

export const deleteShow = async (id: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete<ApiResponse<void>>(`/shows/${id}`);
  return { success: response.data.success };
};

export const updateShowStatus = async (id: string, status: Show['status']): Promise<Show> => {
  const response = await apiClient.patch<ApiResponse<Show>>(`/shows/${id}`, { status });
  if (!response.data.data) {
    throw new Error('Failed to update show status');
  }
  return response.data.data;
};

export const getShowDetail = async (id: string): Promise<ShowDetail> => {
  const response = await apiClient.get<ApiResponse<ShowDetail>>(`/shows/${id}`);
  if (!response.data.data) {
    throw new Error('Show not found');
  }
  return response.data.data;
};

export const getWatchRecords = async (showId: string): Promise<WatchRecord[]> => {
  const response = await apiClient.get<ApiResponse<WatchRecord[]>>(`/shows/${showId}/records`);
  return response.data.data || [];
};

export const addWatchRecord = async (
  showId: string,
  record: {
    season: number;
    episode: number;
    rating: number;
    comment: string;
  }
): Promise<WatchRecord> => {
  const response = await apiClient.post<ApiResponse<WatchRecord>>(
    `/shows/${showId}/records`,
    record
  );
  if (!response.data.data) {
    throw new Error('Failed to add watch record');
  }
  return response.data.data;
};

export const deleteWatchRecord = async (id: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete<ApiResponse<void>>(`/records/${id}`);
  return { success: response.data.success };
};

export default apiClient;
