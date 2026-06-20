import { useMemo } from 'react';
import type { TimeStatus } from '../types';

export function useCountdown(
  remainingSeconds: number,
  durationSeconds: number
): {
  mm: string;
  ss: string;
  percentage: number;
  status: TimeStatus;
} {
  const safeRemaining = Math.max(0, remainingSeconds);
  const safeDuration = Math.max(1, durationSeconds);
  const percentage = Math.max(0, Math.min(100, (safeRemaining / safeDuration) * 100));

  const status: TimeStatus = useMemo(() => {
    const ratio = safeRemaining / safeDuration;
    if (ratio > 0.6) return 'green';
    if (ratio > 0.3) return 'yellow';
    return 'red';
  }, [safeRemaining, safeDuration]);

  const mm = String(Math.floor(safeRemaining / 60)).padStart(2, '0');
  const ss = String(safeRemaining % 60).padStart(2, '0');

  return { mm, ss, percentage, status };
}
