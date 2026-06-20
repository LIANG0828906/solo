import type { Server, Socket } from 'socket.io';
import { tasks, milestones } from './routes';
import type { Task, Milestone, Notification } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

export function setupSocketHandler(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('task:created', (task: Task) => {
      const notification: Notification = {
        id: uuidv4(),
        message: `创建了 ${task.name}`,
        userId: task.assignee,
        userName: task.assigneeName,
        type: 'task-created',
        timestamp: Date.now()
      };
      io.emit('task:created', task);
      io.emit('notification', notification);
    });

    socket.on('task:updated', (task: Task) => {
      const existingTask = tasks.get(task.id);
      let type: Notification['type'] = 'task-updated';
      let message = `更新了 ${task.name}`;

      if (existingTask && existingTask.status !== 'completed' && task.status === 'completed') {
        type = 'task-completed';
        message = `完成了 ${task.name}`;
      } else if (existingTask && existingTask.status === task.status) {
        type = 'task-dragged';
        message = `调整了 ${task.name} 的排期`;
      }

      const notification: Notification = {
        id: uuidv4(),
        message,
        userId: task.assignee,
        userName: task.assigneeName,
        type,
        timestamp: Date.now()
      };

      io.emit('task:updated', task);
      io.emit('notification', notification);
    });

    socket.on('task:deleted', (taskId: string) => {
      io.emit('task:deleted', taskId);
    });

    socket.on('task:dependency-added', (data: { taskId: string; depTaskId: string }) => {
      io.emit('task:dependency-added', data);
    });

    socket.on('milestone:created', (milestone: Milestone) => {
      io.emit('milestone:created', milestone);
    });

    socket.on('milestone:updated', (milestone: Milestone) => {
      io.emit('milestone:updated', milestone);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
