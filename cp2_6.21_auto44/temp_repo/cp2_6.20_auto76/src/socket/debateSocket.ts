import { io, Socket } from 'socket.io-client';

class DebateSocket {
  private socket: Socket | null = null;
  private handlers: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket?.connected) return;
    this.socket = io({ transports: ['websocket', 'polling'] });
    this.socket.on('connect', () => { this.emitLocal('connected', {}); });
    this.socket.on('disconnect', () => { this.emitLocal('disconnected', {}); });
    this.socket.on('new_message', (data: any) => { this.emitLocal('new_message', data); });
    this.socket.on('new_node', (data: any) => { this.emitLocal('new_node', data); });
    this.socket.on('new_connection', (data: any) => { this.emitLocal('new_connection', data); });
    this.socket.on('connection_removed', (data: any) => { this.emitLocal('connection_removed', data); });
    this.socket.on('node_updated', (data: any) => { this.emitLocal('node_updated', data); });
    this.socket.on('room_updated', (data: any) => { this.emitLocal('room_updated', data); });
  }

  disconnect() { this.socket?.disconnect(); this.socket = null; }

  joinRoom(roomId: string) { this.socket?.emit('join_room', { roomId }); }
  leaveRoom(roomId: string) { this.socket?.emit('leave_room', { roomId }); }

  sendMessage(roomId: string, userId: string, side: 'pro' | 'con', content: string, parentNodeId?: string, connectionType?: 'support' | 'refute') {
    this.socket?.emit('send_message', { roomId, userId, side, content, parentNodeId, connectionType });
  }

  connectArgument(roomId: string, fromNodeId: string, toNodeId: string, type: 'support' | 'refute') {
    this.socket?.emit('connect_argument', { roomId, fromNodeId, toNodeId, type });
  }

  disconnectArgument(roomId: string, connectionId: string) {
    this.socket?.emit('disconnect_argument', { roomId, connectionId });
  }

  supportNode(roomId: string, nodeId: string) {
    this.socket?.emit('support_node', { roomId, nodeId });
  }

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.handlers.get(event);
    if (handlers) this.handlers.set(event, handlers.filter(h => h !== handler));
  }

  private emitLocal(event: string, data: any) {
    const handlers = this.handlers.get(event);
    if (handlers) handlers.forEach(h => h(data));
  }
}

export const debateSocket = new DebateSocket();
