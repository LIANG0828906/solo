import axios from 'axios';
import type { User, Message, Match, RecommendResponse, SendHeartResponse, ProfileFormData } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const getRecommendUsers = async (
  currentUserId: string,
  page: number = 1,
  limit: number = 10,
  excludeIds: string[] = []
): Promise<RecommendResponse> => {
  const response = await api.get('/users/recommend', {
    params: {
      userId: currentUserId,
      page,
      limit,
      excludeIds: excludeIds.join(','),
    },
  });
  return response.data;
};

export const createUser = async (data: ProfileFormData): Promise<User> => {
  const response = await api.post('/users', data);
  return response.data;
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};

export const getUser = async (userId: string): Promise<User> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const sendHeart = async (fromUserId: string, toUserId: string): Promise<SendHeartResponse> => {
  const response = await api.post('/hearts', { fromUserId, toUserId });
  return response.data;
};

export const getMatches = async (userId: string): Promise<Match[]> => {
  const response = await api.get(`/matches/${userId}`);
  return response.data;
};

export const getMessages = async (matchId: string, since?: string): Promise<Message[]> => {
  const response = await api.get(`/messages/${matchId}`, {
    params: since ? { since } : {},
  });
  return response.data;
};

export const sendMessage = async (
  matchId: string,
  senderId: string,
  content: string
): Promise<Message> => {
  const response = await api.post('/messages', { matchId, senderId, content });
  return response.data;
};

export default api;
