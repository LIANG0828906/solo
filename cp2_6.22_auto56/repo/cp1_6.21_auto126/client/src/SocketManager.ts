import { io, Socket } from 'socket.io-client';
import { BlockData, BlockType, PlayerData } from './types';

interface SocketManagerCallbacks {
  onWorldData: (data: {
    blocks: BlockData[];
    players: PlayerData[];
    yourPlayerId: string;
    yourNickname: string;
    yourAvatarColor: string;
  }) => void;
  onBlockUpdate: (data: {
    x: number;
    y: number;
    z: number;
    blockType: BlockType | null;
    playerId: string;
    color?: string;
  }) => void;
  onPlayerJoin: (data: { player: PlayerData }) => void;
  onPlayerLeave: (data: { playerId: string }) => void;
  onPlayerList: (data: { players: PlayerData[] }) => void;
  onPlayerMove: (data: { playerId: string; position: { x: number; y: number; z: number } }) => void;
}

export class SocketManager {
  private socket: Socket | null = null;
  private callbacks: SocketManagerCallbacks;

  constructor(callbacks: SocketManagerCallbacks) {
    this.callbacks = callbacks;
  }

  connect(): void {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3002';
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ 已连接到服务器');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ 已断开服务器连接');
    });

    this.socket.on('worldData', this.callbacks.onWorldData);
    this.socket.on('blockUpdate', this.callbacks.onBlockUpdate);
    this.socket.on('playerJoin', this.callbacks.onPlayerJoin);
    this.socket.on('playerLeave', this.callbacks.onPlayerLeave);
    this.socket.on('playerList', this.callbacks.onPlayerList);
    this.socket.on('playerMove', this.callbacks.onPlayerMove);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  placeBlock(x: number, y: number, z: number, blockType: BlockType, playerId: string, color?: string): void {
    if (this.socket) {
      this.socket.emit('placeBlock', { x, y, z, blockType, playerId, color });
    }
  }

  removeBlock(x: number, y: number, z: number, playerId: string): void {
    if (this.socket) {
      this.socket.emit('removeBlock', { x, y, z, playerId });
    }
  }

  sendPlayerMove(playerId: string, position: { x: number; y: number; z: number }): void {
    if (this.socket) {
      this.socket.emit('playerMove', { playerId, position });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
