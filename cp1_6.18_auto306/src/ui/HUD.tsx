import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';

const HUD = () => {
  const { health, maxHealth, shardsCollected, totalShards, currentArea } = useGameStore();
  const [heartAnimIndex, setHeartAnimIndex] = useState<number | null>(null);

  useEffect(() => {
    if (health < maxHealth) {
      setHeartAnimIndex(health);
      const timer = setTimeout(() => setHeartAnimIndex(null), 300);
      return () => clearTimeout(timer);
    }
  }, [health, maxHealth]);

  const hearts = [];
  for (let i = 0; i < maxHealth; i++) {
    const isActive = i < health;
    const isAnimating = heartAnimIndex === i;
    hearts.push(
      <div
        key={i}
        style={{
          width: '24px',
          height: '24px',
          marginLeft: i === 0 ? 0 : '4px',
          transform: isAnimating ? 'scale(1.3)' : 'scale(1)',
          transition: 'transform 0.3s ease',
          display: 'inline-block',
        }}
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={isActive ? '#E53935' : '#888888'}
          />
        </svg>
      </div>
    );
  }

  const progress = totalShards > 0 ? shardsCollected / totalShards : 0;
  const radius = 30;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: 'Microsoft YaHei, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF',
          fontSize: '20px',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
        }}
      >
        {currentArea}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '8px 12px',
          borderRadius: '8px',
        }}
      >
        {hearts}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          width: `${radius * 2 + strokeWidth * 2}px`,
          height: `${radius * 2 + strokeWidth * 2}px`,
        }}
      >
        <svg
          width={radius * 2 + strokeWidth * 2}
          height={radius * 2 + strokeWidth * 2}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E53935" />
              <stop offset="100%" stopColor="#FF8F00" />
            </linearGradient>
          </defs>
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="rgba(0, 0, 0, 0.5)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {shardsCollected}/{totalShards}
        </div>
      </div>
    </div>
  );
};

export default HUD;
