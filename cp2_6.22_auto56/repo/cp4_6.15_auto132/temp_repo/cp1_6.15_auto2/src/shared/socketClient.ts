import { io } from 'socket.io-client';
import { useStore } from './store';

const socket = io();

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('task:moved', (task) => {
  useStore.getState().moveTask(task);
});

socket.on('task:created', (task) => {
  useStore.getState().addTask(task);
});

socket.on('task:updated', (task) => {
  useStore.getState().updateTask(task);
});

socket.on('task:deleted', (data) => {
  useStore.getState().deleteTask(data.id);
});

socket.on('dep:added', (dep) => {
  useStore.getState().addDependency(dep);
});

socket.on('dep:removed', (data) => {
  useStore.getState().removeDependency(data.id);
});

socket.on('member:joined', (data) => {
  useStore.getState().updateMemberStatus(data.id, true);
});

socket.on('member:left', (data) => {
  useStore.getState().updateMemberStatus(data.id, false);
});

export function emitTaskMove(data: { id: string; lane: string; order: number }) {
  socket.emit('task:move', data);
}

export function emitTaskCreate(data: Record<string, unknown>) {
  socket.emit('task:create', data);
}

export function emitTaskUpdate(data: Record<string, unknown>) {
  socket.emit('task:update', data);
}

export function emitTaskDelete(id: string) {
  socket.emit('task:delete', { id });
}

export function emitDepAdd(fromTaskId: string, toTaskId: string) {
  socket.emit('dep:add', { fromTaskId, toTaskId });
}

export function emitDepRemove(id: string) {
  socket.emit('dep:remove', { id });
}

export function emitMemberJoin(memberId: string) {
  socket.emit('member:join', { memberId });
}

export default socket;
