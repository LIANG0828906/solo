import { useEffect, useState, useRef } from 'react';
import { radToDeg } from '../map/MapUtils';

interface NavCompassProps {
  targetAngle: number | null;
  playerFacing: number;
  isFacingAway: boolean;
  size?: number;
}

const NavCompass = ({
  targetAngle,
  playerFacing,
  isFacingAway,
  size = 120,
}: NavCompassProps) => {
  const [displayAngle, setDisplayAngle] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= 16) {
        lastUpdateRef.current = timestamp;

        if (targetAngle !== null) {
          const relativeAngle = targetAngle - playerFacing;
          const angleDeg = radToDeg(relativeAngle);
          setDisplayAngle(angleDeg);
        } else {
          const northAngle = -playerFacing;
          setDisplayAngle(radToDeg(northAngle));
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetAngle, playerFacing]);

  const center = size / 2;
  const radius = size / 2 - 6;

  const directionMarks = [
    { label: 'N', angle: 0, isMain: true },
    { label: 'E', angle: 90, isMain: false },
    { label: 'S', angle: 180, isMain: false },
    { label: 'W', angle: 270, isMain: false },
  ];

  const dots = [];
  for (let i = 0; i < 36; i++) {
    const angle = (i * 10) * (Math.PI / 180);
    const isMainDirection = i % 9 === 0;
    if (!isMainDirection) {
      const x = center + Math.sin(angle) * (radius - 8);
      const y = center - Math.cos(angle) * (radius - 8);
      dots.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r={2}
          fill="rgba(255, 255, 255, 0.4)"
        />
      );
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(15, 15, 30, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.03)',
        overflow: 'hidden',
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: `rotate(${displayAngle}deg)`,
          transition: targetAngle !== null ? 'transform 0.3s ease-in-out' : 'none',
        }}
      >
        <defs>
          <linearGradient id="compassRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#compassRing)"
          strokeWidth={2}
        />

        <circle
          cx={center}
          cy={center}
          r={radius - 4}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={1}
        />

        {dots}

        {directionMarks.map((mark) => {
          const angleRad = (mark.angle * Math.PI) / 180;
          const x = center + Math.sin(angleRad) * (radius - 14);
          const y = center - Math.cos(angleRad) * (radius - 14);
          return (
            <text
              key={mark.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={mark.label === 'N' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'}
              fontWeight={mark.label === 'N' ? 'bold' : 'normal'}
              fontSize={mark.label === 'N' ? size * 0.12 : size * 0.1}
              fontFamily="system-ui, sans-serif"
            >
              {mark.label}
            </text>
          );
        })}

        {targetAngle !== null && (
          <g filter="url(#glow)">
            <polygon
              points={`${center},${center - radius + 12} ${center - 6},${center - radius + 22} ${center + 6},${center - radius + 22}`}
              fill={isFacingAway ? '#ff4444' : '#FFD700'}
            />
          </g>
        )}
      </svg>

      {isFacingAway && targetAngle !== null && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#ff4444',
              fontSize: size * 0.1,
              fontWeight: 'bold',
              animation: 'blink 0.5s infinite',
              textShadow: '0 0 10px rgba(255, 68, 68, 0.8)',
            }}
          >
            ↓ 回头 ↓
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default NavCompass;
