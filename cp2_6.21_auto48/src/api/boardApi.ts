import axios from 'axios';
import { IBoardRoom, ICreative } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const getBoardRooms = async (): Promise<IBoardRoom[]> => {
  const response = await api.get<IBoardRoom[]>('/boardrooms');
  return response.data;
};

export const createBoardRoom = async (data: {
  name: string;
  description: string;
}): Promise<IBoardRoom> => {
  const response = await api.post<IBoardRoom>('/boardrooms', data);
  return response.data;
};

export const getBoardRoom = async (id: string): Promise<IBoardRoom> => {
  const response = await api.get<IBoardRoom>(`/boardrooms/${id}`);
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
    `/boardrooms/${boardRoomId}/creatives`,
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
    `/boardrooms/${boardRoomId}/creatives/${creativeId}/vote`,
    { userId }
  );
  return response.data;
};

export const deleteCreative = async (
  boardRoomId: string,
  creativeId: string
): Promise<void> => {
  await api.delete(`/boardrooms/${boardRoomId}/creatives/${creativeId}`);
};
