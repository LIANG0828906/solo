import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  Block,
  Connection,
  CursorPosition,
  WikiPage,
  VersionHistory,
  VoteCounts,
  VoteType,
} from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

export function useWebSocket(pageId: string, userId: string, userName: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { userName: string; color: string; userInitials: string }>>(new Map());

  const userInitials = userName
    .split(/\s+/)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const connect = useCallback((
    onPageUpdate: (page: WikiPage) => void,
    onBlockUpdated: (blockId: string, content: string, userId: string) => void,
    onBlockReordered: (blockId: string, newIndex: number, userId: string) => void,
    onBlockCreated: (block: Block, index: number, userId: string) => void,
    onBlockDeleted: (blockId: string, userId: string) => void,
    onConnectionCreated: (connection: Connection, userId: string) => void,
    onCursorUpdate: (cursor: CursorPosition) => void,
    onUserJoined: (userId: string, userName: string, color: string) => void,
    onUserLeft: (userId: string) => void,
    onVoteUpdated: (blockId: string, votes: VoteCounts, userId: string) => void,
    onPageRolledBack: (page: WikiPage, userId: string) => void,
  ) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', { pageId, userId, userName });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('user-joined', (data: { userId: string; userName: string; color: string }) => {
      const initials = data.userName
        .split(/\s+/)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      setOnlineUsers(prev => {
        const next = new Map(prev);
        next.set(data.userId, { userName: data.userName, color: data.color, userInitials: initials });
        return next;
      });
      onUserJoined(data.userId, data.userName, data.color);
    });

    socket.on('user-left', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
      onUserLeft(data.userId);
    });

    socket.on('page-data', (data: { page: WikiPage }) => {
      onPageUpdate(data.page);
    });

    socket.on('block-updated', (data: { blockId: string; content: string; userId: string }) => {
      onBlockUpdated(data.blockId, data.content, data.userId);
    });

    socket.on('block-reordered', (data: { blockId: string; newIndex: number; userId: string }) => {
      onBlockReordered(data.blockId, data.newIndex, data.userId);
    });

    socket.on('block-created', (data: { block: Block; index: number; userId: string }) => {
      onBlockCreated(data.block, data.index, data.userId);
    });

    socket.on('block-deleted', (data: { blockId: string; userId: string }) => {
      onBlockDeleted(data.blockId, data.userId);
    });

    socket.on('connection-created', (data: { connection: Connection; userId: string }) => {
      onConnectionCreated(data.connection, data.userId);
    });

    socket.on('cursor-update', (data: CursorPosition) => {
      if (data.userId !== userId) {
        onCursorUpdate(data);
      }
    });

    socket.on('vote-updated', (data: { blockId: string; votes: VoteCounts; userId: string }) => {
      onVoteUpdated(data.blockId, data.votes, data.userId);
    });

    socket.on('page-rolled-back', (data: { page: WikiPage; userId: string }) => {
      onPageRolledBack(data.page, data.userId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [pageId, userId, userName]);

  const sendBlockUpdate = useCallback((blockId: string, content: string) => {
    socketRef.current?.emit('block-update', { blockId, content });
  }, []);

  const sendBlockReorder = useCallback((blockId: string, newIndex: number) => {
    socketRef.current?.emit('block-reorder', { blockId, newIndex });
  }, []);

  const sendBlockCreate = useCallback((block: Block, index: number) => {
    socketRef.current?.emit('block-create', { block, index });
  }, []);

  const sendBlockDelete = useCallback((blockId: string) => {
    socketRef.current?.emit('block-delete', { blockId });
  }, []);

  const sendConnectionCreate = useCallback((connection: Connection) => {
    socketRef.current?.emit('connection-create', { connection });
  }, []);

  const sendCursor = useCallback((cursor: Omit<CursorPosition, 'userId' | 'userName' | 'userInitials' | 'color'> & { color: string }) => {
    socketRef.current?.emit('cursor', {
      ...cursor,
      userId,
      userName,
      userInitials,
    });
  }, [userId, userName, userInitials]);

  const sendVote = useCallback((blockId: string, type: VoteType) => {
    socketRef.current?.emit('vote', { blockId, type });
  }, []);

  const sendRollback = useCallback((versionId: string) => {
    socketRef.current?.emit('rollback', { versionId });
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    connect,
    isConnected,
    onlineUsers,
    userInitials,
    sendBlockUpdate,
    sendBlockReorder,
    sendBlockCreate,
    sendBlockDelete,
    sendConnectionCreate,
    sendCursor,
    sendVote,
    sendRollback,
  };
}
