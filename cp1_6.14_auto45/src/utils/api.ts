import axios from 'axios';
import type { Room, RoomListItem, Vote } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreateRoomParams {
  name: string;
  description?: string;
  tags?: string[];
  hostId: string;
  hostName: string;
}

export interface CreateRoomResult {
  roomId: string;
  inviteCode: string;
}

export const createRoom = async (params: CreateRoomParams): Promise<CreateRoomResult> => {
  const response = await api.post<CreateRoomResult>('/create-room', params);
  return response.data;
};

export const getRooms = async (): Promise<RoomListItem[]> => {
  const response = await api.get<RoomListItem[]>('/rooms');
  return response.data;
};

export const getRoom = async (roomId: string): Promise<Room> => {
  const response = await api.get<Room>(`/rooms/${roomId}`);
  return response.data;
};

export const joinRoom = async (
  roomId: string,
  userId: string,
  userName: string
): Promise<{ success: boolean; room: Room }> => {
  const response = await api.post(`/rooms/${roomId}/join`, { userId, userName });
  return response.data;
};

export const castVote = async (
  roomId: string,
  cardId: string,
  userId: string,
  value: 1 | -1
): Promise<{ success: boolean; vote: Vote }> => {
  const response = await api.post(`/rooms/${roomId}/vote`, { cardId, userId, value });
  return response.data;
};

export const startVoting = async (
  roomId: string,
  hostId: string
): Promise<{ success: boolean; isVoting: boolean }> => {
  const response = await api.post(`/rooms/${roomId}/start-voting`, { hostId });
  return response.data;
};

export const endVoting = async (roomId: string, hostId: string): Promise<{ success: boolean; isVoting: boolean }> => {
  const response = await api.post(`/rooms/${roomId}/end-voting`, { hostId });
  return response.data;
};

export const exportResults = async (roomId: string): Promise<void> => {
  const response = await api.get(`/rooms/${roomId}/export`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'] as string | undefined;
  const filename = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1] || `room-${roomId}-export.json`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;
