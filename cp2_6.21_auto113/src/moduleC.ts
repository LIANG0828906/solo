import { io, type Socket } from 'socket.io-client';
import { useBoardStore } from './store';
import type { Task, TaskStatus } from './types';

let socket: Socket | null = null;
let initialized = false;

export function initSocket(): Socket {
  if (socket && initialized) return socket;

  socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] disconnected');
  });

  socket.on('statusChange', (payload: { taskId: string; status: TaskStatus; updatedAt: string }) => {
    const { taskId, status, updatedAt } = payload;
    useBoardStore.getState().updateTask(taskId, { status, updatedAt });
    const task = useBoardStore.getState().tasks.find((t) => t.id === taskId);
    const titleMap: Record<TaskStatus, string> = {
      pending: '待审查',
      reviewing: '审查中',
      approved: '已通过',
      changes_needed: '需修改',
    };
    useBoardStore.getState().addToast({
      message: `「${task?.title || '任务'}」状态已更新为「${titleMap[status]}」`,
      type: status,
    });
  });

  socket.on('taskCreated', (task: Task) => {
    const state = useBoardStore.getState();
    const exists = state.tasks.find((t) => t.id === task.id);
    if (!exists) {
      state.addTask(task);
      state.addToast({
        message: `新任务：${task.title}`,
        type: 'info',
      });
    }
  });

  socket.on('taskDeleted', (payload: { taskId: string }) => {
    useBoardStore.getState().deleteTask(payload.taskId);
  });

  initialized = true;
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function closeSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    initialized = false;
  }
}
