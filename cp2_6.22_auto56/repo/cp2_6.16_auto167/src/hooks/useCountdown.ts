import { useState, useEffect, useRef, useMemo } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(targetDate: string, updateInterval: number = 1000): CountdownResult {
  const target = useMemo(() => new Date(targetDate), [targetDate]);
  const [now, setNow] = useState(() => new Date());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setNow(new Date());
    }, updateInterval);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [updateInterval]);

  return useMemo(() => {
    const totalMs = target.getTime() - now.getTime();
    const isExpired = totalMs <= 0;

    if (isExpired) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
        isExpired: true,
        formatted: '已可开启',
      };
    }

    const absTarget = target.getTime();
    const absNow = now.getTime();

    const days = differenceInDays(absTarget, absNow);
    const afterDays = absNow + days * 24 * 60 * 60 * 1000;
    const hours = differenceInHours(absTarget, afterDays);
    const afterHours = afterDays + hours * 60 * 60 * 1000;
    const minutes = differenceInMinutes(absTarget, afterHours);
    const afterMinutes = afterHours + minutes * 60 * 1000;
    const seconds = Math.max(0, differenceInSeconds(absTarget, afterMinutes));

    let formatted = '';
    if (days > 0) {
      formatted = `${days}天${hours}小时`;
    } else if (hours > 0) {
      formatted = `${hours}小时${minutes}分`;
    } else if (minutes > 0) {
      formatted = `${minutes}分${seconds}秒`;
    } else {
      formatted = `${seconds}秒`;
    }

    return {
      days,
      hours,
      minutes,
      seconds,
      totalMs,
      isExpired,
      formatted,
    };
  }, [target, now]);
}
