import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  Block,
  Connection,
  CursorPosition,
  WikiPage,
  VoteCounts,
  VoteType,
  OTOperation,
} from '../types';
import { OTClient } from '../utils/ot';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

export function useWebSocket(pageId: string, userId: string, userName: string) {
  const socketRef = useRef<Socket | null>(null);
  const otClientRef = useRef<OTClient>(new OTClient());
  const contentBufferRef = useRef<Map<string, string>>(new Map());
  const sendBufferRef = useRef<Map<string, { oldContent: string; newContent: string }>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { userName: string; color: string; userInitials: string }>>(new Map());

  const userInitials = userName
    .split(/\s+/)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const flushSendBuffer = useCallback((
    onBlockUpdated: (blockId: string, content: string, userId: string) => void,
  ) => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    sendBufferRef.current.forEach((change, blockId) => {
      const ops = otClientRef.current.localEdit(change.oldContent, change.newContent, blockId);
      contentBufferRef.current.set(blockId, change.newContent);

      if (socketRef.current && ops.length > 0) {
        socketRef.current.emit('block-update', {
          blockId,
          content: change.newContent,
          ops,
          revision: otClientRef.current.getRevision(),
          userId,
        });
      }
    });

    sendBufferRef.current.clear();
  }, [userId]);

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
      contentBufferRef.current.clear();
      data.page.blocks.forEach((b: Block) => {
        contentBufferRef.current.set(b.id, b.content);
      });
      otClientRef.current.reset(0);
      onPageUpdate(data.page);
    });

    socket.on('block-updated', (data: { blockId: string; content: string; ops?: OTOperation[]; userId: string; revision?: number }) => {
      if (data.userId === userId) {
        otClientRef.current.serverAck();
        contentBufferRef.current.set(data.blockId, data.content);
        return;
      }

      let finalContent = data.content;

      if (data.ops && data.ops.length > 0) {
        const localContent = contentBufferRef.current.get(data.blockId) || '';
        let transformedContent = localContent;

        for (const op of data.ops) {
          const transformedOp = otClientRef.current.serverOp(op);
          if (transformedOp) {
            transformedContent = applyOTOp(transformedContent, transformedOp);
          }
        }

        finalContent = transformedContent;
      }

      contentBufferRef.current.set(data.blockId, finalContent);
      onBlockUpdated(data.blockId, finalContent, data.userId);
    });

    socket.on('block-reordered', (data: { blockId: string; newIndex: number; userId: string }) => {
      onBlockReordered(data.blockId, data.newIndex, data.userId);
    });

    socket.on('block-created', (data: { block: Block; index: number; userId: string }) => {
      if (data.userId !== userId) {
        contentBufferRef.current.set(data.block.id, data.block.content);
      }
      onBlockCreated(data.block, data.index, data.userId);
    });

    socket.on('block-deleted', (data: { blockId: string; userId: string }) => {
      contentBufferRef.current.delete(data.blockId);
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
      contentBufferRef.current.clear();
      data.page.blocks.forEach((b: Block) => {
        contentBufferRef.current.set(b.id, b.content);
      });
      otClientRef.current.reset(0);
      onPageRolledBack(data.page, data.userId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [pageId, userId, userName]);

  const applyOTOp = useCallback((doc: string, op: OTOperation): string => {
    switch (op.type) {
      case 'insert':
        return doc.slice(0, op.position) + op.text + doc.slice(op.position);
      case 'delete':
        return doc.slice(0, op.position) + doc.slice(op.position + op.length);
      default:
        return doc;
    }
  }, []);

  const sendBlockUpdate = useCallback((blockId: string, content: string) => {
    const oldContent = contentBufferRef.current.get(blockId) || '';
    sendBufferRef.current.set(blockId, { oldContent, newContent: content });

    if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(() => {
        flushSendBuffer(() => {});
      }, 200);
    }
  }, [flushSendBuffer]);

  const sendBlockUpdateImmediate = useCallback((blockId: string, content: string) => {
    const oldContent = contentBufferRef.current.get(blockId) || '';
    const ops = otClientRef.current.localEdit(oldContent, content, blockId);
    contentBufferRef.current.set(blockId, content);

    if (socketRef.current && ops.length > 0) {
      socketRef.current.emit('block-update', {
        blockId,
        content,
        ops,
        revision: otClientRef.current.getRevision(),
        userId,
      });
    }
  }, [userId]);

  const sendBlockReorder = useCallback((blockId: string, newIndex: number) => {
    socketRef.current?.emit('block-reorder', { blockId, newIndex });
  }, []);

  const sendBlockCreate = useCallback((block: Block, index: number) => {
    contentBufferRef.current.set(block.id, block.content);
    socketRef.current?.emit('block-create', { block, index });
  }, []);

  const sendBlockDelete = useCallback((blockId: string) => {
    contentBufferRef.current.delete(blockId);
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
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  return {
    connect,
    isConnected,
    onlineUsers,
    userInitials,
    sendBlockUpdate,
    sendBlockUpdateImmediate,
    sendBlockReorder,
    sendBlockCreate,
    sendBlockDelete,
    sendConnectionCreate,
    sendCursor,
    sendVote,
    sendRollback,
  };
}
