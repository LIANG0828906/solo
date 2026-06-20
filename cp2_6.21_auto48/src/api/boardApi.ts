import axios from 'axios';
import { IBoardRoom, ICreative } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const getBoardRooms = async (): Promise<IBoardRoom[]> => {
  const response = await api.get<IBoardRoom[]>('/board-rooms');
  return response.data;
};

export const createBoardRoom = async (data: {
  name: string;
  description?: string;
}): Promise<IBoardRoom> => {
  const response = await api.post<IBoardRoom>('/board-rooms', data);
  return response.data;
};

export const getBoardRoom = async (id: string): Promise<IBoardRoom> => {
  const response = await api.get<IBoardRoom>(`/board-rooms/${id}`);
  return response.data;
};

export const addCreative = async (
  boardRoomId: string,
  data: {
    content: string;
    type: string;
    author: string;
    createdBy: string;
  }
): Promise<ICreative> => {
  const response = await api.post<ICreative>(
    `/board-rooms/${boardRoomId}/creatives`,
    data
  );
  return response.data;
};

export const voteCreative = async (
  boardRoomId: string,
  creativeId: string,
  userId: string
): Promise<ICreative> => {
  const response = await api.post<ICreative>(
    `/board-rooms/${boardRoomId}/creatives/${creativeId}/vote`,
    { userId }
  );
  return response.data;
};

export const deleteCreative = async (
  boardRoomId: string,
  creativeId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/board-rooms/${boardRoomId}/creatives/${creativeId}`, {
    data: { userId },
  });
};
