import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../../shared/types';
import { useDocStore } from '../store/useDocStore';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const {
    setDocuments,
    setActiveDocId,
    setOnlineUsers,
    addUser,
    removeUser,
    updateUserCursor,
    setVersions,
    addVersion,
    setConnected,
    setReconnecting,
    setCurrentUser,
  } = useDocStore();

  useEffect(() => {
    const socket: TypedSocket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setReconnecting(true);
    });

    (socket as any).on('reconnect_attempt', () => {
      setReconnecting(true);
    });

    (socket as any).on('reconnect', () => {
      setReconnecting(false);
      setConnected(true);
    });

    socket.on('document-list', (docs) => {
      setDocuments(docs);
      const store = useDocStore.getState();
      if (!store.activeDocId && docs.length > 0) {
        setActiveDocId(docs[0].id);
      }
    });

    socket.on('user-joined', (data) => {
      addUser({
        userId: data.userId,
        nickname: data.nickname,
        color: data.color,
      });
    });

    socket.on('user-left', (data) => {
      removeUser(data.userId);
    });

    socket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    socket.on('cursor', (data) => {
      updateUserCursor(data.userId, data.cursor);
    });

    socket.on('version-saved', (data) => {
      addVersion(data.version);
    });

    socket.on('version-list', (data) => {
      setVersions(data.versions);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  return { getSocket };
}
