import type { Server, Socket } from 'socket.io';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  playerId: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  socketId: string;
}

export interface RoomState {
  id: string;
  players: Player[];
  strokes: Stroke[];
  isLocked: boolean;
  hostId: string;
}

const MAGIC_COLORS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16',
  '#F97316', '#14B8A6', '#A855F7', '#E11D48',
];

const MAX_PLAYERS = 8;

class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  private getAvailableColor(roomId: string): string {
    const room = this.rooms.get(roomId);
    if (!room) return MAGIC_COLORS[0];
    const usedColors = room.players.map(p => p.color);
    return MAGIC_COLORS.find(color => !usedColors.includes(color)) || MAGIC_COLORS[0];
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  createRoomIfNotExists(roomId: string): RoomState {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        players: [],
        strokes: [],
        isLocked: false,
        hostId: '',
      });
    }
    return this.rooms.get(roomId)!;
  }

  handleJoinRoom(socket: Socket, data: { roomId: string; playerName: string }) {
    const { roomId, playerName } = data;
    const room = this.createRoomIfNotExists(roomId);

    if (room.players.length >= MAX_PLAYERS) {
      socket.emit('error', { message: '房间已满，最多8人同时在线' });
      return;
    }

    const existingPlayer = room.players.find(p => p.name === playerName);
    let player: Player;

    if (existingPlayer) {
      player = { ...existingPlayer, socketId: socket.id };
      room.players = room.players.map(p => p.name === playerName ? player : p);
    } else {
      const color = this.getAvailableColor(roomId);
      player = {
        id: socket.id,
        name: playerName,
        color,
        socketId: socket.id,
      };
      room.players.push(player);
      if (!room.hostId) {
        room.hostId = player.id;
      }
    }

    socket.join(roomId);

    socket.emit('room-state', {
      players: room.players,
      strokes: room.strokes,
      isLocked: room.isLocked,
      hostId: room.hostId,
      currentPlayer: player,
    });

    this.io.to(roomId).emit('player-joined', { player });
  }

  handleDrawStart(socket: Socket, data: { roomId: string; stroke: Stroke }) {
    const { roomId, stroke } = data;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    if (room.isLocked && player.id !== room.hostId) {
      socket.emit('error', { message: '画布已锁定，只有房主可以绘制' });
      return;
    }

    room.strokes.push(stroke);
    socket.to(roomId).emit('draw-start', { stroke });
  }

  handleDrawMove(socket: Socket, data: { roomId: string; strokeId: string; point: Point }) {
    const { roomId, strokeId, point } = data;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const stroke = room.strokes.find(s => s.id === strokeId);
    if (!stroke) return;

    stroke.points.push(point);
    socket.to(roomId).emit('draw-move', { strokeId, point });
  }

  handleDrawEnd(socket: Socket, data: { roomId: string; strokeId: string }) {
    const { roomId, strokeId } = data;
    socket.to(roomId).emit('draw-end', { strokeId });
  }

  handleLockCanvas(socket: Socket, data: { roomId: string; isLocked: boolean }) {
    const { roomId, isLocked } = data;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.id !== room.hostId) {
      socket.emit('error', { message: '只有房主可以锁定画布' });
      return;
    }

    room.isLocked = isLocked;
    this.io.to(roomId).emit('canvas-locked', { isLocked });
  }

  handleClearRecent(socket: Socket, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.id !== room.hostId) {
      socket.emit('error', { message: '只有房主可以清除画布' });
      return;
    }

    room.strokes = [];
    this.io.to(roomId).emit('canvas-cleared');
  }

  handleSaveCanvasNotification(socket: Socket, data: { roomId: string; canvasId: string; name: string }) {
    const { roomId, canvasId, name } = data;
    this.io.to(roomId).emit('canvas-saved', { canvasId, name });
  }

  handlePlayerCursor(socket: Socket, data: { roomId: string; point: Point }) {
    const { roomId, point } = data;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    socket.to(roomId).emit('player-cursor', { playerId: player.id, point });
  }

  handleDisconnect(socket: Socket) {
    for (const [roomId, room] of this.rooms) {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const [removedPlayer] = room.players.splice(playerIndex, 1);
        socket.to(roomId).emit('player-left', { playerId: removedPlayer });

        if (room.players.length === 0) {
          this.rooms.delete(roomId);
        } else if (room.hostId === removedPlayer.id) {
          room.hostId = room.players[0].id;
          this.io.to(roomId).emit('host-changed', { hostId: room.hostId });
        }
      }
    }
  }

  registerSocketHandlers(socket: Socket) {
    socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
    socket.on('draw-start', (data) => this.handleDrawStart(socket, data));
    socket.on('draw-move', (data) => this.handleDrawMove(socket, data));
    socket.on('draw-end', (data) => this.handleDrawEnd(socket, data));
    socket.on('lock-canvas', (data) => this.handleLockCanvas(socket, data));
    socket.on('clear-recent', (data) => this.handleClearRecent(socket, data));
    socket.on('save-canvas-notification', (data) => this.handleSaveCanvasNotification(socket, data));
    socket.on('player-cursor', (data) => this.handlePlayerCursor(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }
}

export default RoomManager;
