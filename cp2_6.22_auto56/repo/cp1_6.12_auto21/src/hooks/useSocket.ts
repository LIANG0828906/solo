import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBookStore } from '@/store';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  const {
    setShelves,
    setBooks,
    setHeatmapData,
    addAlert,
    setScanResult,
    setReaderProfiles,
    setGuidePath,
  } = useBookStore();

  useEffect(() => {
    const socket = io('/socket.io', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('shelves:request');
      socket.emit('heatmap:request');
      socket.emit('analytics:request');
    });

    socket.on('shelves:data', (data: { shelves: import('@/types').Shelf[]; books: import('@/types').Book[] }) => {
      setShelves(data.shelves);
      setBooks(data.books);
    });

    socket.on('scan:result', (result: { book: import('@/types').Book; shelf: import('@/types').Shelf; slot: import('@/types').ShelfSlot }) => {
      setScanResult(result);
    });

    socket.on('guide:path', (path: import('@/types').GuidePath) => {
      setGuidePath(path);
    });

    socket.on('misplace:alert', (alert: import('@/types').MisplaceAlert) => {
      addAlert(alert);
    });

    socket.on('heatmap:update', (data: import('@/types').HeatmapSlot[]) => {
      setHeatmapData(data);
    });

    socket.on('analytics:result', (data: { profiles: import('@/types').ReaderProfile[] }) => {
      setReaderProfiles(data.profiles);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [setShelves, setBooks, setHeatmapData, addAlert, setScanResult, setReaderProfiles, setGuidePath]);

  const scanBook = (isbn: string) => {
    socketRef.current?.emit('scan:book', { isbn });
  };

  const requestGuide = (bookId: string, currentZone: string) => {
    socketRef.current?.emit('guide:request', { bookId, currentZone });
  };

  const acknowledgeAlert = (alertId: string) => {
    socketRef.current?.emit('misplace:acknowledge', { alertId });
  };

  const requestAnalytics = () => {
    socketRef.current?.emit('analytics:request');
  };

  return { socketRef, scanBook, requestGuide, acknowledgeAlert, requestAnalytics };
}
