import { useState, useEffect, useRef } from 'react';

interface Props {
  weddingDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

function calc(target: number): TimeLeft {
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, passed: false };
}

function CountdownTimer({ weddingDate }: Props) {
  const targetRef = useRef(new Date(weddingDate + 'T00:00:00').getTime());
  const [time, setTime] = useState<TimeLeft>(() => calc(targetRef.current));

  useEffect(() => {
    targetRef.current = new Date(weddingDate + 'T00:00:00').getTime();
    setTime(calc(targetRef.current));
  }, [weddingDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calc(targetRef.current));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="countdown-card">
      <div className="countdown-title">
        {time.passed ? '💒 婚礼已举行，永远幸福！' : '💍 距离婚礼还有'}
      </div>
      {!time.passed ? (
        <div className="countdown-grid">
          <div className="countdown-unit">
            <div className="countdown-num">{time.days}</div>
            <div className="countdown-label">天</div>
          </div>
          <div className="countdown-colon">:</div>
          <div className="countdown-unit">
            <div className="countdown-num">{pad(time.hours)}</div>
            <div className="countdown-label">时</div>
          </div>
          <div className="countdown-colon">:</div>
          <div className="countdown-unit">
            <div className="countdown-num">{pad(time.minutes)}</div>
            <div className="countdown-label">分</div>
          </div>
          <div className="countdown-colon hidden-mobile">:</div>
          <div className="countdown-unit hidden-mobile">
            <div className="countdown-num">{pad(time.seconds)}</div>
            <div className="countdown-label">秒</div>
          </div>
        </div>
      ) : (
        <div className="countdown-passed">愿二位执子之手，与子偕老 💕</div>
      )}
    </div>
  );
}

export default CountdownTimer;
