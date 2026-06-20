import React from 'react';
import { NORMAL_THRESHOLD, PERFECT_THRESHOLD } from './types';

interface RhythmPanelProps {
  beatOffset: number;
}

export const RhythmPanel: React.FC<RhythmPanelProps> = ({ beatOffset }) => {
  const normalizedOffset = Math.max(-1, Math.min(1, beatOffset / NORMAL_THRESHOLD));
  const barWidth = 200;
  const barHeight = 40;
  const indicatorX = barWidth / 2 + (normalizedOffset * barWidth) / 2;

  const getColor = (offset: number): string => {
    const absOffset = Math.abs(offset);
    if (absOffset <= PERFECT_THRESHOLD) {
      return '#00FF88';
    } else if (absOffset <= NORMAL_THRESHOLD) {
      return '#FFD700';
    }
    return '#FF4444';
  };

  const indicatorColor = getColor(beatOffset);

  return (
    <div
      style={{
        width: `${barWidth}px`,
        height: `${barHeight}px`,
        backgroundColor: '#1A1E2E',
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '10%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '80%',
          height: '4px',
          background: 'linear-gradient(to right, #FF4444, #FFD700, #00FF88, #FFD700, #FF4444)',
          borderRadius: '2px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          transform: 'translateX(-50%)',
          width: '2px',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: `${indicatorX}px`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '12px',
          height: '24px',
          backgroundColor: indicatorColor,
          borderRadius: '3px',
          boxShadow: `0 0 10px ${indicatorColor}`,
          transition: 'background-color 0.1s ease, box-shadow 0.1s ease',
        }}
      />
    </div>
  );
};
