import { useState, useEffect, useCallback } from 'react';
import ConfettiEffect from './ConfettiEffect';

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const calculate = useCallback(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      setDays(0);
      setHours(0);
      setMinutes(0);
      setSeconds(0);
      if (!showConfetti) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    if (d !== days) setAnimKey((k) => k + 1);
    setDays(d);
    setHours(h);
    setMinutes(m);
    setSeconds(s);
  }, [targetDate, showConfetti, days]);

  useEffect(() => {
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  if (!targetDate) return null;

  const isZero = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {[
            { value: days, label: '天' },
            { value: hours, label: '时' },
            { value: minutes, label: '分' },
            { value: seconds, label: '秒' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="bg-white rounded-lg px-3 py-2 min-w-[52px] text-center shadow-sm">
                <span
                  key={animKey + i}
                  className="font-display font-bold text-2xl text-slate-800 inline-block animate-scale-bounce"
                >
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
        {isZero && (
          <span className="text-sm font-semibold text-statusPublished">🎉 已发布</span>
        )}
      </div>
      {showConfetti && <ConfettiEffect />}
    </div>
  );
}
