import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Note, Member } from '../types';

interface SocketHandlers {
  onNoteChange?: (note: Note, userId: string) => void;
  onNoteDelete?: (noteId: string, userId: string) => void;
  onMemberJoin?: (member: Member, allMembers: Member[]) => void;
  onMemberLeave?: (userId: string, allMembers: Member[]) => void;
  onVersionCreate?: (version: any) => void;
  onProjectCreate?: (project: any) => void;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<SocketHandlers>({});

  const getSocket = useCallback((): Socket => {
    if (!socketRef.current) {
      socketRef.current = io({
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      });
    }
    return socketRef.current;
  }, []);

  const setHandlers = useCallback((handlers: SocketHandlers) => {
    handlersRef.current = handlers;
  }, []);

  const connect = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }, [getSocket]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinRoom = useCallback((payload: {
    projectId: string;
    userId: string;
    name: string;
    role: 'admin' | 'editor' | 'viewer';
    avatar: string;
  }) => {
    const socket = getSocket();
    socket.emit('join-room', payload);
  }, [getSocket]);

  const leaveRoom = useCallback((projectId: string) => {
    const socket = getSocket();
    socket.emit('leave-room', projectId);
  }, [getSocket]);

  const sendNoteChange = useCallback((payload: {
    projectId: string;
    note: Note;
    userId: string;
  }) => {
    const socket = getSocket();
    socket.emit('note-change', payload);
  }, [getSocket]);

  const sendNoteDelete = useCallback((payload: {
    projectId: string;
    noteId: string;
    userId: string;
  }) => {
    const socket = getSocket();
    socket.emit('note-delete', payload);
  }, [getSocket]);

  const broadcastVersion = useCallback((payload: {
    projectId: string;
    version: any;
  }) => {
    const socket = getSocket();
    socket.emit('version-create', payload);
  }, [getSocket]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('note-change-broadcast', (data: { note: Note; userId: string }) => {
      handlersRef.current.onNoteChange?.(data.note, data.userId);
    });

    socket.on('note-delete-broadcast', (data: { noteId: string; userId: string }) => {
      handlersRef.current.onNoteDelete?.(data.noteId, data.userId);
    });

    socket.on('member-join', (data: { member: Member; members: Member[] }) => {
      handlersRef.current.onMemberJoin?.(data.member, data.members);
    });

    socket.on('member-leave', (data: { userId: string; members: Member[] }) => {
      handlersRef.current.onMemberLeave?.(data.userId, data.members);
    });

    socket.on('version-create-broadcast', (version: any) => {
      handlersRef.current.onVersionCreate?.(version);
    });

    socket.on('project-create-broadcast', (project: any) => {
      handlersRef.current.onProjectCreate?.(project);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('note-change-broadcast');
      socket.off('note-delete-broadcast');
      socket.off('member-join');
      socket.off('member-leave');
      socket.off('version-create-broadcast');
      socket.off('project-create-broadcast');
    };
  }, [getSocket]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendNoteChange,
    sendNoteDelete,
    broadcastVersion,
    setHandlers,
  };
}
