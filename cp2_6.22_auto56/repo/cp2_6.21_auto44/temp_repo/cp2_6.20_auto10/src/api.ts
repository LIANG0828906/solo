import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import type {
  Meeting,
  AgendaItem,
  Task,
  User,
  WebSocketMessage,
  Comment,
  Vote,
  AgendaStatus,
} from './types';

const API_BASE_URL = 'http://localhost:8000/api';
const WS_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const meetingApi = {
  getMeetings: (search?: string): Promise<Meeting[]> =>
    api.get('/meetings', { params: search ? { q: search } : undefined }).then((res) => res.data),

  getMeeting: (id: string): Promise<Meeting> =>
    api.get(`/meetings/${id}`).then((res) => res.data),

  createMeeting: (data: Omit<Meeting, 'id' | 'createdAt' | 'agendaItems'> & { agendaItems: Omit<AgendaItem, 'id' | 'comments' | 'votes'>[] }): Promise<Meeting> =>
    api.post('/meetings', data).then((res) => res.data),

  updateMeeting: (id: string, data: Partial<Meeting>): Promise<Meeting> =>
    api.put(`/meetings/${id}`, data).then((res) => res.data),

  deleteMeeting: (id: string): Promise<void> =>
    api.delete(`/meetings/${id}`).then((res) => res.data),
};

export const agendaApi = {
  addAgendaItem: (meetingId: string, item: Omit<AgendaItem, 'id' | 'comments' | 'votes'>): Promise<AgendaItem> =>
    api.post(`/meetings/${meetingId}/agenda`, item).then((res) => res.data),

  updateAgendaItem: (meetingId: string, itemId: string, data: Partial<AgendaItem>): Promise<AgendaItem> =>
    api.put(`/meetings/${meetingId}/agenda/${itemId}`, data).then((res) => res.data),

  updateAgendaOrder: (meetingId: string, itemIds: string[]): Promise<void> =>
    api.put(`/meetings/${meetingId}/agenda-order`, { itemIds }).then((res) => res.data),

  deleteAgendaItem: (meetingId: string, itemId: string): Promise<void> =>
    api.delete(`/meetings/${meetingId}/agenda/${itemId}`).then((res) => res.data),

  addComment: (meetingId: string, itemId: string, content: string): Promise<Comment> =>
    api.post(`/meetings/${meetingId}/agenda/${itemId}/comments`, { content }).then((res) => res.data),

  castVote: (meetingId: string, itemId: string, voteType: 'agree' | 'disagree' | 'abstain'): Promise<Vote> =>
    api.post(`/meetings/${meetingId}/agenda/${itemId}/votes`, { type: voteType }).then((res) => res.data),

  updateStatus: (meetingId: string, itemId: string, status: AgendaStatus): Promise<AgendaItem> =>
    api.put(`/meetings/${meetingId}/agenda/${itemId}/status`, { status }).then((res) => res.data),
};

export const taskApi = {
  getTasks: (): Promise<Task[]> =>
    api.get('/tasks').then((res) => res.data),

  getTasksByMeeting: (meetingId: string): Promise<Task[]> =>
    api.get(`/tasks/meeting/${meetingId}`).then((res) => res.data),

  updateTaskStatus: (taskId: string, status: Task['status']): Promise<Task> =>
    api.put(`/tasks/${taskId}/status`, { status }).then((res) => res.data),

  generateTasksFromMeeting: (meetingId: string): Promise<Task[]> =>
    api.post(`/tasks/generate/${meetingId}`).then((res) => res.data),
};

export const userApi = {
  getCurrentUser: (): Promise<User> =>
    api.get('/users/me').then((res) => res.data),

  getUsers: (): Promise<User[]> =>
    api.get('/users').then((res) => res.data),
};

export class MeetingWebSocket {
  private socket: Socket | null = null;
  private meetingId: string | null = null;
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();

  connect(meetingId: string): void {
    if (this.socket && this.meetingId === meetingId) {
      return;
    }

    this.disconnect();
    this.meetingId = meetingId;

    this.socket = io(WS_BASE_URL, {
      query: { meetingId },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('message', (message: WebSocketMessage) => {
      this.emit(message.type, message.data);
    });

    this.socket.on('comment', (data: unknown) => {
      this.emit('comment', data);
    });

    this.socket.on('vote', (data: unknown) => {
      this.emit('vote', data);
    });

    this.socket.on('status_change', (data: unknown) => {
      this.emit('status_change', data);
    });

    this.socket.on('agenda_order', (data: unknown) => {
      this.emit('agenda_order', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.meetingId = null;
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  sendComment(agendaItemId: string, content: string): void {
    if (this.socket) {
      this.socket.emit('comment', { agendaItemId, content });
    }
  }

  sendVote(agendaItemId: string, voteType: 'agree' | 'disagree' | 'abstain'): void {
    if (this.socket) {
      this.socket.emit('vote', { agendaItemId, type: voteType });
    }
  }

  sendStatusChange(agendaItemId: string, status: AgendaStatus): void {
    if (this.socket) {
      this.socket.emit('status_change', { agendaItemId, status });
    }
  }

  sendAgendaOrder(itemIds: string[]): void {
    if (this.socket) {
      this.socket.emit('agenda_order', { itemIds });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const meetingWS = new MeetingWebSocket();
