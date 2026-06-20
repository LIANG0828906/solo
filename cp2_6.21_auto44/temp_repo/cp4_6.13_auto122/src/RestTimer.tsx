import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface WorkPeriod {
  start: string;
  end: string;
}

interface RestTimerProps {
  workPeriods: WorkPeriod[];
  onShowReminder: () => void;
}

function isInWorkPeriod(periods: WorkPeriod[]): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const p of periods) {
    const [sh, sm] = p.start.split(':').map(Number);
    const [eh, em] = p.end.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    if (currentMinutes >= startMins && currentMinutes <= endMins) {
      return true;
    }
  }
  return false;
}

const WORK_INTERVAL = 45 * 60 * 1000;
const REST_DURATION = 5 * 60 * 1000;

const RestTimer: React.FC<RestTimerProps> = ({ workPeriods, onShowReminder }) => {
  const lastTriggerRef = useRef<number>(0);
  const restEndRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAndTrigger = useCallback(() => {
    const now = Date.now();

    if (restEndRef.current > 0 && now >= restEndRef.current) {
      restEndRef.current = 0;
      onShowReminder();
      lastTriggerRef.current = now;
      return;
    }

    if (!isInWorkPeriod(workPeriods)) {
      return;
    }

    if (now - lastTriggerRef.current >= WORK_INTERVAL && restEndRef.current === 0) {
      onShowReminder();
      lastTriggerRef.current = now;
    }
  }, [workPeriods, onShowReminder]);

  useEffect(() => {
    lastTriggerRef.current = Date.now();
    restEndRef.current = 0;
    timerRef.current = setInterval(checkAndTrigger, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkAndTrigger]);

  const startRestCountdown = useCallback(() => {
    restEndRef.current = Date.now() + REST_DURATION;
    lastTriggerRef.current = Date.now();
  }, []);

  const skipRest = useCallback(() => {
    restEndRef.current = 0;
    lastTriggerRef.current = Date.now();
  }, []);

  useEffect(() => {
    (window as unknown as { __restTimer?: { startRest: () => void; skip: () => void } }).__restTimer = {
      startRest: startRestCountdown,
      skip: skipRest,
    };
  }, [startRestCountdown, skipRest]);

  return null;
};

export default RestTimer;
