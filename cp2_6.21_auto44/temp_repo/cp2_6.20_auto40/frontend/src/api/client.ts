import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import type { Story } from '../types';

interface ListParams {
  page?: number;
  pageSize?: number;
  published?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'playCount' | 'averageRating';
  sortOrder?: 'asc' | 'desc';
}

interface CreateStoryData {
  title: string;
  author: string;
  description?: string;
  coverImageUrl?: string;
}

interface UpdateStoryData {
  title?: string;
  author?: string;
  description?: string;
  coverImageUrl?: string;
  published?: boolean;
  nodes?: Story['nodes'];
  edges?: Story['edges'];
  variables?: Story['variables'];
  startNodeId?: string;
}

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const api = {
  getStories: async (params?: ListParams): Promise<Story[]> => {
    return axiosInstance.get('/stories', { params });
  },

  getStory: async (id: string): Promise<Story> => {
    return axiosInstance.get(`/stories/${id}`);
  },

  createStory: async (data: CreateStoryData): Promise<Story> => {
    return axiosInstance.post('/stories', data);
  },

  updateStory: async (id: string, data: UpdateStoryData): Promise<Story> => {
    return axiosInstance.put(`/stories/${id}`, data);
  },

  publishStory: async (id: string): Promise<{ shortUrl: string }> => {
    return axiosInstance.post(`/stories/${id}/publish`);
  },

  incrementPlay: async (id: string): Promise<{ playCount: number }> => {
    return axiosInstance.post(`/stories/${id}/play`);
  },

  rateStory: async (
    id: string,
    rating: number
  ): Promise<{ averageRating: number; ratingCount: number }> => {
    return axiosInstance.post(`/stories/${id}/rate`, { rating });
  },

  getStoryByShort: async (shortId: string): Promise<Story> => {
    return axiosInstance.get(`/stories/short/${shortId}`);
  },
};

export const socket: Socket = io('/ws', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('connect', () => {
  console.log('WebSocket connected');
});

socket.on('disconnect', () => {
  console.log('WebSocket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});
