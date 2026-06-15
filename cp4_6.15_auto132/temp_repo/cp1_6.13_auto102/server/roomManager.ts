import { WebSocket } from 'ws';

export interface Room {
  code: string;
  hostId: string;
  clients: Map<string, WebSocket>;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  generateRoomCode(): string {
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += Math.floor(Math.random() * 10).toString();
      }
    } while (this.rooms.has(code));
    return code;
  }

  isValidRoomCode(code: string): boolean {
    return /^\d{4}$/.test(code);
  }

  createRoom(userId: string, ws: WebSocket): string {
    const code = this.generateRoomCode();
    const clients = new Map<string, WebSocket>();
    clients.set(userId, ws);
    this.rooms.set(code, {
      code,
      hostId: userId,
      clients,
    });
    return code;
  }

  joinRoom(roomCode: string, userId: string, ws: WebSocket): { success: boolean; users?: string[]; isHost?: boolean; error?: string } {
    if (!this.isValidRoomCode(roomCode)) {
      return { success: false, error: '房间码格式错误，请输入4位数字' };
    }
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }
    if (room.clients.size >= 4) {
      return { success: false, error: '房间已满（最多4人）' };
    }
    if (room.clients.has(userId)) {
      return { success: false, error: '已在房间中' };
    }
    room.clients.set(userId, ws);
    const users = Array.from(room.clients.keys());
    return { success: true, users, isHost: false };
  }

  leaveRoom(roomCode: string, userId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    room.clients.delete(userId);
    if (room.clients.size === 0) {
      this.rooms.delete(roomCode);
    }
    return true;
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  findUserRoom(userId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.clients.has(userId)) {
        return room;
      }
    }
    return undefined;
  }

  broadcast(roomCode: string, excludeUserId: string | null, message: any) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const data = JSON.stringify(message);
    room.clients.forEach((ws, uid) => {
      if (uid !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  sendTo(userId: string, message: any) {
    const room = this.findUserRoom(userId);
    if (!room) return;
    const ws = room.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  clearCanvas(roomCode: string, userId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    if (room.hostId !== userId) return false;
    return true;
  }

  kickUser(roomCode: string, requesterId: string, targetUserId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    if (room.hostId !== requesterId) return false;
    if (!room.clients.has(targetUserId)) return false;
    if (targetUserId === requesterId) return false;
    const targetWs = room.clients.get(targetUserId);
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(JSON.stringify({ type: 'kicked' }));
    }
    room.clients.delete(targetUserId);
    return true;
  }

  removeUserByWs(ws: WebSocket): { roomCode: string | null; userId: string | null } {
    for (const room of this.rooms.values()) {
      for (const [uid, clientWs] of room.clients.entries()) {
        if (clientWs === ws) {
          room.clients.delete(uid);
          if (room.clients.size === 0) {
            this.rooms.delete(room.code);
          }
          return { roomCode: room.code, userId: uid };
        }
      }
    }
    return { roomCode: null, userId: null };
  }
}

export const roomManager = new RoomManager();
