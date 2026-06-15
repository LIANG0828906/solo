import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import type { BoardData, Board, Task, UpdateTaskRequest, BoardUpdateEvent } from '../types';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
});

let socket: Socket | null = null;
const boardUpdateListeners = new Set<(event: BoardUpdateEvent) => void>();

const initSocket = (): void => {
  if (socket) return;

  socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('boardUpdate', (event: BoardUpdateEvent) => {
    console.log('Received boardUpdate:', event);
    boardUpdateListeners.forEach((listener) => listener(event));
  });
};

export const subscribeToBoardUpdates = (
  listener: (event: BoardUpdateEvent) => void
): (() => void) => {
  initSocket();
  boardUpdateListeners.add(listener);
  return () => {
    boardUpdateListeners.delete(listener);
  };
};

export const fetchBoards = async (): Promise<BoardData> => {
  const response = await apiClient.get<BoardData>('/boards');
  return response.data;
};

export const fetchBoard = async (boardId: string): Promise<Board> => {
  const response = await apiClient.get<Board>(`/board/${boardId}`);
  return response.data;
};

export const updateTaskCard = async (
  taskId: string,
  data: UpdateTaskRequest
): Promise<Task> => {
  const response = await apiClient.put<{ success: boolean; task: Task }>(
    `/task/${taskId}`,
    data
  );
  return response.data.task;
};

export const createTask = async (data: UpdateTaskRequest): Promise<Task> => {
  const response = await apiClient.post<{ success: boolean; task: Task }>(
    '/task',
    data
  );
  return response.data.task;
};

export const deleteTask = async (
  taskId: string,
  data: { columnId: string; boardId: string }
): Promise<void> => {
  await apiClient.delete(`/task/${taskId}`, { data });
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
