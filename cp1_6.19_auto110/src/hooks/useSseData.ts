import { useState, useEffect, useRef, useCallback } from 'react';

export interface Seat {
  id: string;
  row: number;
  col: number;
  checkedIn: boolean;
  checkInTime?: number;
}

export interface SseData {
  seats: Seat[];
  recentCheckIns: number[];
  checkInQueue: string[];
}

export function useSseData(
  initialSeats: Seat[], enabled: boolean) {
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [recentSpeeds, setRecentSpeeds] = useState<number[]>([]);
  const lastUpdateRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    setSeats(initialSeats);
    lastUpdateRef.current = [];
    setRecentSpeeds([]);
  }, [initialSeats]);

  const getRandomUncheckedSeat = useCallback((currentSeats: Seat[]): Seat | null => {
    const unchecked = currentSeats.filter(s => !s.checkedIn);
    if (unchecked.length === 0) return null;
    return unchecked[Math.floor(Math.random() * unchecked.length)];
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      if (!enabledRef.current) return;

      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      lastUpdateRef.current = lastUpdateRef.current.filter(t => t > fiveMinutesAgo);

      setSeats(prevSeats => {
        const shouldCheckIn = Math.random() < 0.6;
        if (!shouldCheckIn) return prevSeats;

        const targetSeat = getRandomUncheckedSeat(prevSeats);
        if (!targetSeat) return prevSeats;

        lastUpdateRef.current.push(now);

        return prevSeats.map(s =>
          s.id === targetSeat.id
            ? { ...s, checkedIn: true, checkInTime: now }
            : s
        );
      });

      const timeWindow = 5 * 60 * 1000;
      const count = lastUpdateRef.current.length;
      const speedPerMinute = count / (timeWindow / 60000);
      setRecentSpeeds(prev => {
        const next = [...prev, speedPerMinute].slice(-10);
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, getRandomUncheckedSeat]);

  const manualCheckIn = useCallback((seatId: string) => {
    const now = Date.now();
    lastUpdateRef.current.push(now);
    setSeats(prevSeats =>
      prevSeats.map(s =>
        s.id === seatId && !s.checkedIn
          ? { ...s, checkedIn: true, checkInTime: now }
          : s
      )
    );
  }, []);

  const averageSpeed = recentSpeeds.length > 0
    ? recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length
    : 0;

  return {
    seats,
    manualCheckIn,
    recentSpeed: averageSpeed,
  };
}
