import { io, Socket } from 'socket.io-client';

const socket: Socket = io({
  path: '/socket.io',
  transports: ['websocket', 'polling'],
});

export const socketApi = {
  get socket() {
    return socket;
  },
  
  on(event: string, callback: (...args: any[]) => void) {
    socket.on(event, callback);
  },
  
  off(event: string, callback: (...args: any[]) => void) {
    socket.off(event, callback);
  },
  
  emit(event: string, ...args: any[]) {
    socket.emit(event, ...args);
  },
  
  moveTask(taskId: string, status: string, order: number) {
    socket.emit('task:move', { taskId, status, order });
  },
  
  createTask(data: any) {
    socket.emit('task:create', data);
  },
  
  updateTask(data: any) {
    socket.emit('task:update', data);
  },
  
  deleteTask(taskId: string) {
    socket.emit('task:delete', taskId);
  },
  
  disconnect() {
    socket.disconnect();
  },
};

export default socket;
