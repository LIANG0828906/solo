import { useState, useEffect } from 'react';

interface CountdownProps {
  deadline: string;
  size?: 'small' | 'large';
}

export default function Countdown({ deadline, size = 'small' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [blinkState, setBlinkState] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    setBlinkState(prev => !prev);

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      setBlinkState(prev => !prev);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const pad = (num: number) => num.toString().padStart(2, '0');

  const fontSize = size === 'large' ? '24px' : '14px';
  const color = blinkState ? '#FFCC80' : '#FFFFFF';

  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'large' ? '12px 24px' : '6px 12px',
        background: 'linear-gradient(135deg, #FF9500 0%, #FFB74D 100%)',
        borderRadius: '8px',
        color,
        transition: 'color 0.5s ease',
        width: 'fit-content',
      }}
    >
      <span>{pad(timeLeft.days)}天</span>
      <span>{pad(timeLeft.hours)}时</span>
      <span>{pad(timeLeft.minutes)}分</span>
    </div>
  );
}
