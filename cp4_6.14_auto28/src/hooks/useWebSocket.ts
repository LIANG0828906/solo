import { useState, useEffect, useRef, useCallback } from 'react';
import { WSMessage, WSMessageType, MindMap, User, RoomState } from '../types';

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  users: User[];
  currentUserId: string | null;
  roomId: string | null;
  sendMessage: (type: WSMessageType, payload: any) => void;
  joinRoom: (roomId: string, nickname: string) => Promise<RoomState | null>;
  leaveRoom: () => void;
  reconnectAttempts: number;
  mindMap: MindMap | null;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 1000;

export const useWebSocket = (onMessage?: (message: WSMessage) => void): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [mindMap, setMindMap] = useState<MindMap | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualCloseRef = useRef(false);
  const joinResolverRef = useRef<((value: RoomState | null) => void) | null>(null);
  const nicknameRef = useRef<string>('');
  const joinRoomIdRef = useRef<string>('');

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    isManualCloseRef.current = false;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:3001/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectAttempts(0);

        if (joinRoomIdRef.current && nicknameRef.current) {
          const msg: WSMessage = {
            type: 'join_room',
            payload: { roomId: joinRoomIdRef.current, nickname: nicknameRef.current },
            timestamp: Date.now()
          };
          ws.send(JSON.stringify(msg));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'room_state':
              const state = message.payload as RoomState;
              setMindMap(state.mindMap);
              setUsers(state.users);
              if (joinResolverRef.current) {
                joinResolverRef.current(state);
                joinResolverRef.current = null;
              }
              break;

            case 'user_list':
              setUsers(message.payload as User[]);
              break;

            case 'node_add':
            case 'node_update':
            case 'node_delete':
            case 'node_move':
            case 'tree_update':
            case 'cursor_update':
              if (onMessage) {
                onMessage(message);
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);

        if (!isManualCloseRef.current && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts);
          reconnectTimerRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnecting(false);
    }
  }, [onMessage, reconnectAttempts]);

  const sendMessage = useCallback((type: WSMessageType, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type,
        payload,
        timestamp: Date.now()
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const joinRoom = useCallback((id: string, nickname: string): Promise<RoomState | null> => {
    joinRoomIdRef.current = id;
    nicknameRef.current = nickname;
    setRoomId(id);

    return new Promise((resolve) => {
      joinResolverRef.current = resolve;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msg: WSMessage = {
          type: 'join_room',
          payload: { roomId: id, nickname },
          timestamp: Date.now()
        };
        wsRef.current.send(JSON.stringify(msg));
      } else {
        connect();
      }

      setTimeout(() => {
        if (joinResolverRef.current) {
          joinResolverRef.current(null);
          joinResolverRef.current = null;
        }
      }, 10000);
    });
  }, [connect]);

  const leaveRoom = useCallback(() => {
    isManualCloseRef.current = true;
    clearReconnectTimer();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setRoomId(null);
    setCurrentUserId(null);
    setUsers([]);
    setMindMap(null);
    setReconnectAttempts(0);
    joinRoomIdRef.current = '';
    nicknameRef.current = '';
  }, [clearReconnectTimer]);

  useEffect(() => {
    return () => {
      isManualCloseRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearReconnectTimer]);

  useEffect(() => {
    if (users.length > 0 && joinRoomIdRef.current) {
      const nickname = nicknameRef.current;
      const me = users.find((u) => u.nickname === nickname);
      if (me) {
        setCurrentUserId(me.id);
      }
    }
  }, [users]);

  return {
    isConnected,
    isConnecting,
    users,
    currentUserId,
    roomId,
    sendMessage,
    joinRoom,
    leaveRoom,
    reconnectAttempts,
    mindMap
  };
};
