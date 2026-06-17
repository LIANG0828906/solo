import { useState, useEffect } from 'react';
import { Clock, Timer } from 'lucide-react';
import { getCountdown } from '../utils/time';
import type { CountdownData } from '../utils/time';

type CountdownVariant = 'detail' | 'card';

interface CountdownTimerProps {
  deadline: number;
  variant?: CountdownVariant;
}

export function CountdownTimer({ deadline, variant = 'detail' }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState<CountdownData>(() => getCountdown(deadline));

  useEffect(() => {
    setCountdown(getCountdown(deadline));
    const interval = setInterval(() => {
      setCountdown(getCountdown(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const getColor = (): string => {
    if (countdown.isExpired) return 'var(--text-secondary)';
    if (countdown.isUrgent) return 'var(--accent-danger)';
    return 'var(--accent-success)';
  };

  const color = getColor();

  if (variant === 'card') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color,
          transition: 'color 0.3s',
        }}
      >
        <Clock size={14} />
        {countdown.isExpired ? (
          <span>已结束</span>
        ) : countdown.isUrgent ? (
          <span style={{ fontWeight: 600 }}>
            {countdown.hours}时{countdown.minutes}分{countdown.seconds}秒
          </span>
        ) : (
          <span>剩余 {countdown.label}</span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: countdown.isExpired
          ? 'rgba(144, 144, 168, 0.08)'
          : countdown.isUrgent
            ? 'rgba(255, 107, 107, 0.08)'
            : 'rgba(0, 212, 170, 0.08)',
        borderRadius: '12px',
        padding: '16px 20px',
        border: `1px solid ${
          countdown.isExpired
            ? 'rgba(144, 144, 168, 0.15)'
            : countdown.isUrgent
              ? 'rgba(255, 107, 107, 0.2)'
              : 'rgba(0, 212, 170, 0.15)'
        }`,
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: countdown.isExpired ? '0' : '14px',
        }}
      >
        {countdown.isUrgent && !countdown.isExpired ? (
          <Timer size={18} style={{ color, flexShrink: 0 }} />
        ) : (
          <Clock size={18} style={{ color, flexShrink: 0 }} />
        )}
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color,
            transition: 'color 0.3s',
          }}
        >
          {countdown.isExpired ? '投票已结束' : countdown.isUrgent ? '即将到期' : '投票倒计时'}
        </span>
      </div>

      {!countdown.isExpired && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '30px',
          }}
        >
          {countdown.days > 0 && (
            <TimeUnit value={countdown.days} unit="天" color={color} />
          )}
          <TimeUnit value={countdown.hours} unit="时" color={color} />
          <TimeUnit value={countdown.minutes} unit="分" color={color} />
          <TimeUnit value={countdown.seconds} unit="秒" color={color} />
        </div>
      )}
    </div>
  );
}

function TimeUnit({ value, unit, color }: { value: number; unit: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '36px',
          height: '32px',
          padding: '0 8px',
          backgroundColor: 'var(--bg-component)',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.3s',
        }}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}
      >
        {unit}
      </span>
    </div>
  );
}
