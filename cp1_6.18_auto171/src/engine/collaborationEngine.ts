import { io, Socket } from 'socket.io-client';
import type { BoardElement, Snapshot } from '@/data/boardData';

type RemoteActionHandler = (action: RemoteAction) => void;

export interface RemoteAction {
  type: 'element:add' | 'element:update' | 'element:delete' | 'clear' | 'state' | 'snapshot' | 'rollback';
  element?: BoardElement;
  elementId?: string;
  elements?: BoardElement[];
  snapshots?: Snapshot[];
  snapshot?: Snapshot;
  expiredSnapshotIds?: string[];
}

export class CollaborationEngine {
  private socket: Socket | null = null;
  private roomId: string = '';
  private handler: RemoteActionHandler | null = null;

  connect(roomId: string): void {
    this.roomId = roomId;
    this.socket = io({ transports: ['websocket', 'polling'] });

    this.socket.on('room:state', (data: { elements: BoardElement[]; snapshots: Snapshot[] }) => {
      this.handler?.({ type: 'state', elements: data.elements, snapshots: data.snapshots });
    });

    this.socket.on('room:element:add', (element: BoardElement) => {
      this.handler?.({ type: 'element:add', element });
    });

    this.socket.on('room:element:update', (element: BoardElement) => {
      this.handler?.({ type: 'element:update', element });
    });

    this.socket.on('room:element:delete', (elementId: string) => {
      this.handler?.({ type: 'element:delete', elementId });
    });

    this.socket.on('room:clear', () => {
      this.handler?.({ type: 'clear' });
    });

    this.socket.on('room:snapshot', (snapshot: Snapshot) => {
      this.handler?.({ type: 'snapshot', snapshot });
    });

    this.socket.on('room:rollback', (data: { elements: BoardElement[]; expiredSnapshotIds: string[] }) => {
      this.handler?.({ type: 'rollback', elements: data.elements, expiredSnapshotIds: data.expiredSnapshotIds });
    });

    this.socket.emit('room:join', roomId);
  }

  onRemoteAction(handler: RemoteActionHandler): void {
    this.handler = handler;
  }

  sendElementAdd(element: BoardElement): void {
    this.socket?.emit('room:element:add', element);
  }

  sendElementUpdate(element: BoardElement): void {
    this.socket?.emit('room:element:update', element);
  }

  sendElementDelete(elementId: string): void {
    this.socket?.emit('room:element:delete', elementId);
  }

  sendClear(): void {
    this.socket?.emit('room:clear');
  }

  sendRollback(snapshotId: string): void {
    this.socket?.emit('room:rollback', snapshotId);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.roomId = '';
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
