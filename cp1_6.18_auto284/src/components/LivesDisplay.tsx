import React from 'react';

interface LivesDisplayProps {
  lives: number;
  maxLives: number;
}

const HEART_SIZE = 20;
const HEART_GAP = 4;
const HEART_COLOR = '#FF6B6B';

const HeartSVG: React.FC<{ filled: boolean; index: number; lives: number }> = React.memo(
  ({ filled, index, lives }) => {
    const shouldAnimateOut = !filled && index === lives;
    return (
      <svg
        width={HEART_SIZE}
        height={HEART_SIZE}
        viewBox="0 0 24 24"
        style={{
          marginRight: HEART_GAP,
          flexShrink: 0,
          animation: shouldAnimateOut ? 'heartShrink 0.3s ease forwards' : 'none',
          opacity: filled ? 1 : 0.15,
          transition: 'opacity 0.3s ease',
          filter: filled ? `drop-shadow(0 0 3px ${HEART_COLOR})` : 'none',
        }}
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={filled ? HEART_COLOR : '#333333'}
        />
      </svg>
    );
  }
);

const LivesDisplay: React.FC<LivesDisplayProps> = ({ lives, maxLives }) => {
  const hearts = Array.from({ length: maxLives }, (_, i) => i < lives);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {hearts.map((filled, i) => (
        <HeartSVG key={i} filled={filled} index={i} lives={lives} />
      ))}
    </div>
  );
};

export default React.memo(LivesDisplay);
