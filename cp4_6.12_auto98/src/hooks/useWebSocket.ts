import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Bidder {
  id: string;
  name: string;
}

export interface BidRecord {
  id: string;
  user: string;
  amount: number;
  timestamp: number;
}

export interface RoomState {
  roomId: string;
  roomName: string;
  startPrice: number;
  bidStep: number;
  currentPrice: number;
  bidders: Bidder[];
  bidHistory: BidRecord[];
  status: 'waiting' | 'active' | 'ended';
  timeLeft: number;
  winner: string | null;
  finalPrice: number | null;
  images: string[];
}

export interface Notification {
  id: string;
  user: string;
  amount: number;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const addNotification = useCallback((user: string, amount: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setNotifications((prev) => [...prev, { id, user, amount }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room-created', (data: { roomId: string }) => {
      setRoomId(data.roomId);
    });

    socket.on('room-state', (state: RoomState) => {
      setRoomState(state);
      setRoomId(state.roomId);
    });

    socket.on('bid-placed', (data: BidRecord) => {
      addNotification(data.user, data.amount);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addNotification]);

  const createRoom = useCallback((roomName: string, startPrice: number, bidStep: number, userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('create-room', { roomName, startPrice, bidStep, userName });
    }
  }, []);

  const joinRoom = useCallback((roomId: string, userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', { roomId, userName });
    }
  }, []);

  const placeBid = useCallback((amount: number) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('place-bid', { roomId, amount });
    }
  }, [roomId]);

  return {
    roomState,
    notifications,
    isConnected,
    error,
    roomId,
    createRoom,
    joinRoom,
    placeBid,
  };
}
