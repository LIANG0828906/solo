import { io, Socket } from 'socket.io-client';
import type { Frame } from '../stores/editorStore';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  connect(): Socket {
    if (!this.socket) {
      this.socket = io({
        transports: ['websocket', 'polling'],
      });
      this.socket.onAny((event, ...args) => {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          callbacks.forEach((cb) => cb(...args));
        }
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T extends (...args: unknown[]) => void>(event: string, callback: T): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  joinRoom(room: string, name: string) {
    this.connect().emit('join_room', { room, name });
  }

  drawPixel(x: number, y: number, color: string | null) {
    this.socket?.emit('pixel_draw', { x, y, color });
  }

  fillArea(
    startX: number,
    startY: number,
    targetColor: string | null,
    replaceColor: string | null
  ) {
    this.socket?.emit('fill_area', { startX, startY, targetColor, replaceColor });
  }

  setPixels(pixels: (string | null)[][]) {
    this.socket?.emit('set_pixels', pixels);
  }

  selectExpression(expressionId: string) {
    this.socket?.emit('expression_select', expressionId);
  }

  addFrame(frame: Frame) {
    this.socket?.emit('add_frame', frame);
  }

  deleteFrame(index: number) {
    this.socket?.emit('delete_frame', index);
  }

  reorderFrames(from: number, to: number) {
    this.socket?.emit('reorder_frames', { from, to });
  }

  updateFrameDuration(index: number, duration: number) {
    this.socket?.emit('update_frame_duration', { index, duration });
  }

  selectFrame(index: number) {
    this.socket?.emit('select_frame', index);
  }

  undo() {
    this.socket?.emit('undo');
  }

  redo() {
    this.socket?.emit('redo');
  }
}

export const socketClient = new SocketClient();
