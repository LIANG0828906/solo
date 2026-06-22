import { useEffect, useState, useRef } from 'react';

interface DistanceIndicatorProps {
  distance: number | null;
  heightDiff: number | null;
  isFacingAway: boolean;
  isNearTarget: boolean;
}

const DistanceIndicator = ({
  distance,
  heightDiff,
  isFacingAway,
  isNearTarget,
}: DistanceIndicatorProps) => {
  const [displayDistance, setDisplayDistance] = useState<number | null>(null);
  const [displayHeightDiff, setDisplayHeightDiff] = useState<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= 16) {
        lastUpdateRef.current = timestamp;

        if (distance !== null) {
          if (
            lastDistanceRef.current === null ||
            Math.abs(distance - lastDistanceRef.current) > 0.5
          ) {
            setPulseKey((prev) => prev + 1);
            lastDistanceRef.current = distance;
          }
          setDisplayDistance(distance);
        } else {
          setDisplayDistance(null);
          lastDistanceRef.current = null;
        }

        setDisplayHeightDiff(heightDiff);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [distance, heightDiff]);

  const formatNumber = (value: number | null, decimals = 1): string => {
    if (value === null) return '--';
    return value.toFixed(decimals);
  };

  const textColor = isFacingAway ? '#ff4444' : isNearTarget ? '#4ade80' : '#ffffff';

  return (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'rgba(15, 15, 30, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
        minWidth: '160px',
        fontFamily: 'monospace',
      }}
    >
      <div
        key={`dist-${pulseKey}`}
        style={{
          color: textColor,
          fontSize: 'clamp(18px, 4vw, 24px)',
          fontWeight: 'bold',
          lineHeight: 1.2,
          textShadow: isFacingAway
            ? '0 0 10px rgba(255, 68, 68, 0.8)'
            : isNearTarget
            ? '0 0 10px rgba(74, 222, 128, 0.8)'
            : '0 0 10px rgba(255, 255, 255, 0.3)',
          animation: 'pulse 0.2s ease-in-out',
          transition: 'color 0.3s ease-in-out',
        }}
      >
        {formatNumber(displayDistance)} m
      </div>
      <div
        style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: 'clamp(12px, 2.5vw, 14px)',
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ color: heightDiff !== null && heightDiff > 0 ? '#4ade80' : heightDiff !== null && heightDiff < 0 ? '#f87171' : 'rgba(255, 255, 255, 0.6)' }}>
          {heightDiff !== null && heightDiff > 0 ? '↑' : heightDiff !== null && heightDiff < 0 ? '↓' : '—'}
        </span>
        <span>{formatNumber(displayHeightDiff !== null ? Math.abs(displayHeightDiff) : null)} m</span>
      </div>
      <div
        style={{
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: 'clamp(10px, 2vw, 11px)',
          marginTop: '4px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        距离 / 高度
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default DistanceIndicator;
