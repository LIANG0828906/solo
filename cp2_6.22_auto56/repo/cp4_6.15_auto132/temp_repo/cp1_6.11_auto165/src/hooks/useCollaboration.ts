import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { BoardElement } from '@/canvasItem';
import { useBoardStore } from '@/store/boardStore';

export function useCollaboration() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const boardId = useBoardStore((s) => s.boardId);
  const syncElements = useBoardStore((s) => s.syncElements);

  useEffect(() => {
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    if (boardId) {
      socket.emit('join-board', boardId);
    }

    socket.on('board-sync', (elements: BoardElement[]) => {
      syncElements(elements);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [boardId, syncElements]);

  function broadcastUpdate(elements: BoardElement[]) {
    socketRef.current?.emit('board-update', elements);
  }

  return { broadcastUpdate, connected };
}
