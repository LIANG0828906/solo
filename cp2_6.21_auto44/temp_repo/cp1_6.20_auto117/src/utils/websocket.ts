import { io, Socket } from 'socket.io-client';
import { TranscribeProgressEvent, SummaryUpdateEvent } from '../types';

class WebSocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onProgress(callback: (event: TranscribeProgressEvent) => void): void {
    if (!this.socket) return;
    this.socket.on('transcribe_progress', callback);
  }

  offProgress(callback: (event: TranscribeProgressEvent) => void): void {
    if (!this.socket) return;
    this.socket.off('transcribe_progress', callback);
  }

  onSummaryUpdate(callback: (event: SummaryUpdateEvent) => void): void {
    if (!this.socket) return;
    this.socket.on('summary_update', callback);
  }

  offSummaryUpdate(callback: (event: SummaryUpdateEvent) => void): void {
    if (!this.socket) return;
    this.socket.off('summary_update', callback);
  }
}

export const websocketService = new WebSocketService();
