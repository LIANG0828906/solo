import { io, type Socket } from 'socket.io-client';
import { useBoardStore } from './store';
import type { Task, TaskStatus } from './types';

let socket: Socket | null = null;
let initialized = false;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let pongTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
const pendingAcks = new Map<
  string,
  { timeout: ReturnType<typeof setTimeout>; retries: number; payload: any; eventName: string }
>();

function clearHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (pongTimeoutTimer) {
    clearTimeout(pongTimeoutTimer);
    pongTimeoutTimer = null;
  }
}

function clearPendingAcks() {
  pendingAcks.forEach((p) => clearTimeout(p.timeout));
  pendingAcks.clear();
}

function startHeartbeat(sock: Socket) {
  clearHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (!sock || !sock.connected) return;
    if (pongTimeoutTimer) clearTimeout(pongTimeoutTimer);
    pongTimeoutTimer = setTimeout(() => {
      console.warn('[Socket] pong timeout, reconnecting...');
      clearPendingAcks();
      sock.disconnect();
      sock.connect();
    }, 3000);
    sock.emit('ping', { t: Date.now() }, () => {
      if (pongTimeoutTimer) {
        clearTimeout(pongTimeoutTimer);
        pongTimeoutTimer = null;
      }
    });
  }, 30000);
}

function sendWithAck(eventName: string, payload: any, retriesLeft = 3) {
  if (!socket || !socket.connected) return;
  const id = `${eventName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timeout = setTimeout(() => {
    const pending = pendingAcks.get(id);
    if (pending && pending.retries > 0) {
      console.warn(`[Socket] ${eventName} ack timeout, retrying (${pending.retries} left)`);
      pending.retries -= 1;
      pending.timeout = setTimeout(() => {
        const p = pendingAcks.get(id);
        if (p && p.retries > 0) {
          sendWithAck(eventName, p.payload, p.retries - 1);
        }
      }, 1000);
      socket?.emit(eventName, { ...payload, __ackId: id });
    } else {
      pendingAcks.delete(id);
    }
  }, 1000);
  pendingAcks.set(id, { timeout, retries: retriesLeft, payload, eventName });
  socket.emit(eventName, { ...payload, __ackId: id }, (ack: any) => {
    const pending = pendingAcks.get(id);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingAcks.delete(id);
    }
  });
}

export function emitStatusChange(payload: { taskId: string; status: TaskStatus }) {
  sendWithAck('statusChange', payload, 2);
}

export function initSocket(): Socket {
  if (socket && initialized) return socket;

  socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] connected:', socket?.id);
    if (socket) startHeartbeat(socket);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] disconnected:', reason);
    clearHeartbeat();
  });

  socket.on('reconnect', (attempt) => {
    console.log('[Socket] reconnected after', attempt, 'attempts');
    if (socket) startHeartbeat(socket);
  });

  socket.on('pong', () => {
    if (pongTimeoutTimer) {
      clearTimeout(pongTimeoutTimer);
      pongTimeoutTimer = null;
    }
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
  clearHeartbeat();
  clearPendingAcks();
  if (socket) {
    socket.disconnect();
    socket = null;
    initialized = false;
  }
}
