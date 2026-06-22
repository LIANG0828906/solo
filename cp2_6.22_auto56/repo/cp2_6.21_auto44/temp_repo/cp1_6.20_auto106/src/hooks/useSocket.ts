import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CheckinEvent } from '../types';

export function useSocket(eventId: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('join-event', eventId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    return () => {
      socket.emit('leave-event', eventId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId]);

  const onCheckin = useCallback((callback: (data: CheckinEvent) => void) => {
    if (!socketRef.current) return;
    
    const handler = (data: CheckinEvent) => {
      callback(data);
    };
    
    socketRef.current.on('checkin', handler);
    
    return () => {
      socketRef.current?.off('checkin', handler);
    };
  }, []);

  return { onCheckin };
}
