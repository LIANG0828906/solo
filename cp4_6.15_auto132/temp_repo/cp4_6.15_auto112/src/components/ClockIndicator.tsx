import { useMemo } from 'react';
import { formatTime } from '../utils/dateUtils';

interface ClockIndicatorProps {
  time: number;
  sunAltitude: number;
  isPlaying: boolean;
}

export const ClockIndicator: React.FC<ClockIndicatorProps> = ({
  time,
  sunAltitude,
  isPlaying,
}) => {
  const altitudeDegrees = useMemo(() => {
    return (sunAltitude * 180) / Math.PI;
  }, [sunAltitude]);

  const normalizedAltitude = useMemo(() => {
    return Math.max(0, Math.min(1, altitudeDegrees / 90));
  }, [altitudeDegrees]);

  const arcPath = useMemo(() => {
    const cx = 50;
    const cy = 50;
    const r = 40;
    const startAngle = Math.PI;
    const endAngle = startAngle + Math.PI * normalizedAltitude;
    
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    
    const largeArc = normalizedAltitude > 0.5 ? 1 : 0;
    
    if (normalizedAltitude <= 0) {
      return '';
    }
    
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }, [normalizedAltitude]);

  const gradientId = 'altitude-gradient';

  return (
    <div
      className="fixed top-4 right-4 z-50 rounded-xl p-4 text-white"
      style={{
        background: 'rgba(10, 20, 40, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #00d4ff',
        boxShadow: '0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)',
        minWidth: '200px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400' : 'bg-gray-400'}`}
            style={{
              boxShadow: isPlaying ? '0 0 8px rgba(74, 222, 128, 0.8)' : 'none',
              animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span className="text-xs text-cyan-300">
            {isPlaying ? '播放中' : '已暂停'}
          </span>
        </div>
      </div>

      <div
        className="text-4xl font-mono font-bold text-center mb-4"
        style={{
          color: '#e0f7ff',
          textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
          letterSpacing: '2px',
        }}
      >
        {formatTime(time)}
      </div>

      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-cyan-200">太阳高度角</span>
          <span
            className="text-sm font-mono font-semibold"
            style={{
              color: altitudeDegrees > 45 ? '#00d4ff' : '#ff9966',
              textShadow: altitudeDegrees > 45
                ? '0 0 6px rgba(0, 212, 255, 0.5)'
                : '0 0 6px rgba(255, 153, 102, 0.5)',
            }}
          >
            {altitudeDegrees.toFixed(1)}°
          </span>
        </div>

        <svg viewBox="0 0 100 55" className="w-full h-14">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff9966" />
              <stop offset="50%" stopColor="#ffcc66" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
          </defs>

          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {arcPath && (
            <path
              d={arcPath}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="6"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(0, 212, 255, 0.6))',
              }}
            />
          )}

          <circle cx="10" cy="50" r="3" fill="#ff9966" />
          <circle cx="50" cy="10" r="3" fill="#00d4ff" />
          <circle cx="90" cy="50" r="3" fill="#ff9966" />

          <text x="10" y="52" textAnchor="middle" fill="#94a3b8" fontSize="8">
            0°
          </text>
          <text x="50" y="7" textAnchor="middle" fill="#94a3b8" fontSize="8">
            90°
          </text>
          <text x="90" y="52" textAnchor="middle" fill="#94a3b8" fontSize="8">
            0°
          </text>
        </svg>

        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>东</span>
          <span>天顶</span>
          <span>西</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default ClockIndicator;
