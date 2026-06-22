import { useState, useCallback, useRef, useEffect } from 'react';
import { CollabAction, MOCK_TRACKS } from '../playlist/playlistStore';

interface CollabMessage {
  type: string;
  action?: CollabAction;
  userId: string;
  roomId: string;
}

type MessageCallback = (action: CollabAction) => void;

class MockCollabServer {
  private static instance: MockCollabServer;
  private rooms: Map<string, Set<string>> = new Map();
  private handlers: Map<string, MessageCallback> = new Map();
  private onlineCountCallbacks: Map<string, (count: number) => void> = new Map();

  private constructor() {}

  static getInstance(): MockCollabServer {
    if (!MockCollabServer.instance) {
      MockCollabServer.instance = new MockCollabServer();
    }
    return MockCollabServer.instance;
  }

  joinRoom(roomId: string, userId: string, onOnlineCountChange?: (count: number) => void): number {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    const room = this.rooms.get(roomId)!;
    room.add(userId);
    if (onOnlineCountChange) {
      this.onlineCountCallbacks.set(userId, onOnlineCountChange);
    }
    this.notifyOnlineCount(roomId);
    return room.size;
  }

  leaveRoom(roomId: string, userId: string): number {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      this.notifyOnlineCount(roomId);
      return room.size;
    }
    return 0;
  }

  registerHandler(userId: string, handler: MessageCallback) {
    this.handlers.set(userId, handler);
  }

  unregisterHandler(userId: string) {
    this.handlers.delete(userId);
    this.onlineCountCallbacks.delete(userId);
  }

  broadcast(roomId: string, message: CollabMessage) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach((userId) => {
      if (userId !== message.userId) {
        const handler = this.handlers.get(userId);
        if (handler && message.action) {
          const delay = 80 + Math.random() * 120;
          setTimeout(() => handler(message.action!), delay);
        }
      }
    });
  }

  getOnlineCount(roomId: string): number {
    return this.rooms.get(roomId)?.size || 0;
  }

  private notifyOnlineCount(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const count = room.size;
    room.forEach((userId) => {
      const cb = this.onlineCountCallbacks.get(userId);
      if (cb) cb(count);
    });
  }
}

const ROOM_ID = 'default-room';
const LOCAL_USER_ID = 'user-local';
const REMOTE_USER_ID = 'user-remote';

const server = MockCollabServer.getInstance();

export function useCollaboration(onRemoteAction: (action: CollabAction) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const remoteTimerRef = useRef<number | null>(null);
  const handlerRef = useRef(onRemoteAction);
  const pulseRef = useRef(pulseKey);

  handlerRef.current = onRemoteAction;
  pulseRef.current = pulseKey;

  const triggerPulse = useCallback(() => {
    setPulseKey((k) => k + 1);
  }, []);

  const connect = useCallback(() => {
    server.registerHandler(LOCAL_USER_ID, (action) => {
      handlerRef.current(action);
      triggerPulse();
    });

    const count = server.joinRoom(ROOM_ID, LOCAL_USER_ID, (c) => {
      setOnlineCount(c);
    });
    setOnlineCount(count);
    setIsConnected(true);

    setTimeout(() => {
      server.registerHandler(REMOTE_USER_ID, () => {});
      server.joinRoom(ROOM_ID, REMOTE_USER_ID, (c) => {
        setOnlineCount(c);
      });

      remoteTimerRef.current = window.setInterval(() => {
        const randomIndex = Math.floor(Math.random() * MOCK_TRACKS.length);
        const track = MOCK_TRACKS[randomIndex];
        const action: CollabAction = {
          type: 'add',
          track: { ...track, id: `remote-${Date.now()}` },
        };

        const message: CollabMessage = {
          type: 'add',
          action,
          userId: REMOTE_USER_ID,
          roomId: ROOM_ID,
        };

        server.broadcast(ROOM_ID, message);
      }, 12000 + Math.random() * 8000);
    }, 1500);
  }, [triggerPulse]);

  const disconnect = useCallback(() => {
    if (remoteTimerRef.current) {
      clearInterval(remoteTimerRef.current);
      remoteTimerRef.current = null;
    }
    server.leaveRoom(ROOM_ID, LOCAL_USER_ID);
    server.unregisterHandler(LOCAL_USER_ID);
    server.leaveRoom(ROOM_ID, REMOTE_USER_ID);
    server.unregisterHandler(REMOTE_USER_ID);
    setIsConnected(false);
    setOnlineCount(0);
  }, []);

  const broadcastAction = useCallback(
    (action: CollabAction) => {
      if (!isConnected) return;

      const message: CollabMessage = {
        type: action.type,
        action,
        userId: LOCAL_USER_ID,
        roomId: ROOM_ID,
      };

      server.broadcast(ROOM_ID, message);
      triggerPulse();
    },
    [isConnected, triggerPulse]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    onlineCount,
    pulseKey,
    connect,
    disconnect,
    broadcastAction,
  };
}
