import type { SyncEvent, UserState, RoomState } from './types';

interface SharedWorkerGlobalScope {
  onconnect: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown) => void;
  close: () => void;
}

declare const self: SharedWorkerGlobalScope;

const rooms = new Map<string, RoomState>();
const ports = new Map<string, Set<MessagePort>>();

function generateRoomId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function broadcastToRoom(roomId: string, message: SyncEvent, excludePort?: MessagePort): void {
  const roomPorts = ports.get(roomId);
  if (!roomPorts) return;
  
  roomPorts.forEach((port) => {
    if (port !== excludePort) {
      port.postMessage(message);
    }
  });
}

function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      users: new Map(),
    };
    rooms.set(roomId, room);
    ports.set(roomId, new Set());
  }
  return room;
}

function handleCreateRoom(port: MessagePort): string {
  let roomId: string;
  do {
    roomId = generateRoomId();
  } while (rooms.has(roomId));
  
  getOrCreateRoom(roomId);
  const roomPorts = ports.get(roomId)!;
  roomPorts.add(port);
  
  return roomId;
}

function handleJoinRoom(port: MessagePort, roomId: string, user: UserState): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  
  const roomPorts = ports.get(roomId)!;
  roomPorts.add(port);
  room.users.set(user.userId, user);
  
  return true;
}

function handleLeaveRoom(port: MessagePort, roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.users.delete(userId);
  
  const roomPorts = ports.get(roomId);
  if (roomPorts) {
    roomPorts.delete(port);
    
    if (roomPorts.size === 0) {
      rooms.delete(roomId);
      ports.delete(roomId);
    }
  }
}

function handleSyncEvent(port: MessagePort, event: SyncEvent): void {
  const roomId = (event.payload as any).roomId;
  if (!roomId) return;
  
  const room = rooms.get(roomId);
  if (!room) return;
  
  switch (event.type) {
    case 'user-join': {
      const payload = event.payload as any;
      const user: UserState = {
        userId: payload.userId,
        userName: payload.userName,
        avatarColor: payload.avatarColor,
        muted: false,
        volume: 80,
        isSpeaking: false,
        lastActive: Date.now(),
      };
      room.users.set(user.userId, user);
      break;
    }
    case 'user-leave': {
      const payload = event.payload as any;
      room.users.delete(payload.userId);
      break;
    }
    case 'user-mute': {
      const payload = event.payload as any;
      const user = room.users.get(payload.userId);
      if (user) {
        user.muted = payload.muted;
      }
      break;
    }
    case 'user-volume': {
      const payload = event.payload as any;
      const user = room.users.get(payload.userId);
      if (user) {
        user.volume = payload.volume;
      }
      break;
    }
    case 'user-name': {
      const payload = event.payload as any;
      const user = room.users.get(payload.userId);
      if (user) {
        user.userName = payload.userName;
      }
      break;
    }
    case 'ping': {
      const pongEvent: SyncEvent<'pong'> = {
        type: 'pong',
        userId: 'server',
        timestamp: Date.now(),
        payload: {
          timestamp: (event.payload as any).timestamp,
        },
      };
      port.postMessage(pongEvent);
      return;
    }
  }
  
  broadcastToRoom(roomId, event, port);
}

function handleGetRoomInfo(port: MessagePort, roomId: string, _requestUserId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const users = Array.from(room.users.values()).map((u) => ({
    userId: u.userId,
    userName: u.userName,
    avatarColor: u.avatarColor,
    muted: u.muted,
    volume: u.volume,
    isSpeaking: u.isSpeaking,
  }));
  
  const event: SyncEvent<'room-info'> = {
    type: 'room-info',
    userId: 'server',
    timestamp: Date.now(),
    payload: {
      roomId,
      users,
    },
  };
  
  port.postMessage(event);
}

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;
  
  port.onmessage = (e: MessageEvent) => {
    const { action, data } = e.data;
    
    switch (action) {
      case 'create-room': {
        const roomId = handleCreateRoom(port);
        currentRoomId = roomId;
        port.postMessage({
          type: 'room-created',
          roomId,
        });
        break;
      }
      case 'join-room': {
        const { roomId, user } = data;
        const success = handleJoinRoom(port, roomId, user);
        currentRoomId = roomId;
        currentUserId = user.userId;
        
        if (success) {
          port.postMessage({
            type: 'room-joined',
            roomId,
          });
          
          const joinEvent: SyncEvent<'user-join'> = {
            type: 'user-join',
            userId: user.userId,
            timestamp: Date.now(),
            payload: {
              userId: user.userId,
              userName: user.userName,
              avatarColor: user.avatarColor,
            },
          };
          broadcastToRoom(roomId, joinEvent, port);
        } else {
          port.postMessage({
            type: 'join-failed',
            reason: '房间不存在',
          });
        }
        break;
      }
      case 'leave-room': {
        if (currentRoomId && currentUserId) {
          const leaveEvent: SyncEvent<'user-leave'> = {
            type: 'user-leave',
            userId: currentUserId,
            timestamp: Date.now(),
            payload: {
              userId: currentUserId,
            },
          };
          broadcastToRoom(currentRoomId, leaveEvent, port);
          handleLeaveRoom(port, currentRoomId, currentUserId);
        }
        currentRoomId = null;
        currentUserId = null;
        break;
      }
      case 'get-room-info': {
        const { roomId, userId } = data;
        handleGetRoomInfo(port, roomId, userId);
        break;
      }
      case 'sync-event': {
        handleSyncEvent(port, data);
        break;
      }
      case 'ping': {
        const pingEvent: SyncEvent<'ping'> = {
          type: 'ping',
          userId: currentUserId || 'unknown',
          timestamp: Date.now(),
          payload: {
            timestamp: Date.now(),
          },
        };
        handleSyncEvent(port, pingEvent);
        break;
      }
    }
  };
  
  port.onmessageerror = () => {
    if (currentRoomId && currentUserId) {
      handleLeaveRoom(port, currentRoomId, currentUserId);
    }
  };
};

export {};
