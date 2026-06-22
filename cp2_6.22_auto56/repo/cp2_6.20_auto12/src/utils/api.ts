import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import type {
  Poll,
  Vote,
  BestTimeRecommendation,
  CreatePollRequest,
  SubmitVoteRequest,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export const pollApi = {
  create: async (data: CreatePollRequest): Promise<Poll> => {
    const response = await api.post('/polls', data);
    return response.data;
  },

  get: async (pollId: string): Promise<Poll> => {
    const response = await api.get(`/polls/${pollId}`);
    return response.data;
  },

  submitVote: async (pollId: string, data: SubmitVoteRequest): Promise<Vote> => {
    const response = await api.post(`/polls/${pollId}/votes`, data);
    return response.data;
  },

  getBestTime: async (pollId: string): Promise<BestTimeRecommendation> => {
    const response = await api.get(`/polls/${pollId}/best-time`);
    return response.data;
  },

  closePoll: async (pollId: string, adminToken: string): Promise<Poll> => {
    const response = await api.post(`/polls/${pollId}/close`, { adminToken });
    return response.data;
  },

  exportICal: async (pollId: string): Promise<void> => {
    const response = await api.get(`/polls/${pollId}/export`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `poll-${pollId}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default api;
