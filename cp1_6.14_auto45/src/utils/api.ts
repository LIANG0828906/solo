import axios from 'axios';
import type { Room, Card, Vote } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createRoom = async (name: string, userId: string, username: string): Promise<Room> => {
  const response = await api.post<Room>('/rooms', { name, userId, username });
  return response.data;
};

export const getRooms = async (): Promise<Room[]> => {
  const response = await api.get<Room[]>('/rooms');
  return response.data;
};

export const getRoom = async (roomId: string): Promise<Room> => {
  const response = await api.get<Room>(`/rooms/${roomId}`);
  return response.data;
};

export const joinRoom = async (inviteCode: string, userId: string, username: string): Promise<Room> => {
  const response = await api.post<Room>('/rooms/join', { inviteCode, userId, username });
  return response.data;
};

export const castVote = async (roomId: string, cardId: string, participantId: string, score: number): Promise<Vote> => {
  const response = await api.post<Vote>(`/rooms/${roomId}/votes`, { cardId, participantId, score });
  return response.data;
};

export const startVoting = async (roomId: string): Promise<Room> => {
  const response = await api.post<Room>(`/rooms/${roomId}/start`);
  return response.data;
};

export const endVoting = async (roomId: string): Promise<Room> => {
  const response = await api.post<Room>(`/rooms/${roomId}/end`);
  return response.data;
};

export const exportResults = async (roomId: string): Promise<Blob> => {
  const response = await api.get(`/rooms/${roomId}/export`, {
    responseType: 'blob',
  });
  return response.data;
};

export default api;
