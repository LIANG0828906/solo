import { useState, useCallback, useRef, useEffect } from 'react';
import { KeystrokeEvent } from '../types';
import { RECENT_WINDOW_MS, SPREAD_CONFIG } from '../constants';

export interface KeystrokeTracker {
  events: KeystrokeEvent[];
  totalCount: number;
  addKeystroke: () => { intensity: number; interval: number };
  getRecentFrequency: () => number;
  getOverallFrequency: (elapsedMs: number) => number;
  clear: () => void;
}

export function useKeystrokeTracker(): KeystrokeTracker {
  const eventsRef = useRef<KeystrokeEvent[]>([]);
  const totalCountRef = useRef(0);
  const [, forceRender] = useState(0);

  const cleanupOldEvents = useCallback(() => {
    const cutoff = Date.now() - RECENT_WINDOW_MS;
    eventsRef.current = eventsRef.current.filter(e => e.time > cutoff);
  }, []);

  const addKeystroke = useCallback(() => {
    const now = Date.now();
    const lastEvent = eventsRef.current[eventsRef.current.length - 1];
    const interval = lastEvent ? now - lastEvent.time : 999;
    const intensity = interval < SPREAD_CONFIG.fastInterval
      ? SPREAD_CONFIG.fastMultiplier
      : 1;

    eventsRef.current.push({ time: now, interval });
    totalCountRef.current += 1;
    cleanupOldEvents();
    forceRender(n => n + 1);

    return { intensity, interval };
  }, [cleanupOldEvents]);

  const getRecentFrequency = useCallback((): number => {
    cleanupOldEvents();
    const recentEvents = eventsRef.current;
    if (recentEvents.length < 2) return 0;
    const windowMs = Math.min(
      recentEvents[recentEvents.length - 1].time - recentEvents[0].time,
      RECENT_WINDOW_MS
    );
    if (windowMs < 1000) return 0;
    return Math.round((recentEvents.length / windowMs) * 60 * 1000);
  }, [cleanupOldEvents]);

  const getOverallFrequency = useCallback((elapsedMs: number): number => {
    if (elapsedMs < 1000 || totalCountRef.current === 0) return 0;
    return Math.round((totalCountRef.current / elapsedMs) * 60 * 1000);
  }, []);

  const clear = useCallback(() => {
    eventsRef.current = [];
    totalCountRef.current = 0;
    forceRender(n => n + 1);
  }, []);

  useEffect(() => {
    const interval = setInterval(cleanupOldEvents, 10000);
    return () => clearInterval(interval);
  }, [cleanupOldEvents]);

  return {
    get events() { return eventsRef.current; },
    get totalCount() { return totalCountRef.current; },
    addKeystroke,
    getRecentFrequency,
    getOverallFrequency,
    clear,
  };
}
