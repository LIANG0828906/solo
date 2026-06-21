import { useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import { useGameStore } from '../store/useGameStore';
import type { ToastEvent } from '../types';

export function useRoomPolling(roomId: string | null, enabled = true) {
  const lastPollTime = useRef<number>(0);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setRoom, addToast } = useGameStore();

  const handleEvents = useCallback(
    (events: ToastEvent[]) => {
      for (const event of events) {
        addToast({
          message: event.message,
          type: event.type,
        });
      }
    },
    [addToast]
  );

  const poll = useCallback(async () => {
    if (!roomId || !enabled) return;

    try {
      const response = await api.pollEvents(roomId, lastPollTime.current);
      lastPollTime.current = Date.now();
      setRoom(response.room);
      handleEvents(response.events);
    } catch (error) {
      // Silent fail for polling
    }
  }, [roomId, enabled, setRoom, handleEvents]);

  useEffect(() => {
    if (!roomId || !enabled) {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
      return;
    }

    poll();

    pollInterval.current = setInterval(poll, 500);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, [roomId, enabled, poll]);

  return { poll };
}
