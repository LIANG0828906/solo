import React from 'react';
import { PIXELS_PER_SECOND_BASE } from '../types';

interface PlayheadProps {
  time: number;
  zoom: number;
  isPlaying: boolean;
}

export const Playhead: React.FC<PlayheadProps> = ({ time, zoom, isPlaying }) => {
  const pixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;
  const left = time * pixelsPerSecond;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: `${left}px`,
    bottom: 0,
    width: '2px',
    pointerEvents: 'none',
    zIndex: 100,
    transition: isPlaying ? 'none' : 'left 0.1s ease',
  };

  const lineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '-1px',
    width: '2px',
    height: '100%',
    backgroundColor: 'var(--color-playhead)',
    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
  };

  const headStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '-7px',
    width: '14px',
    height: '14px',
    backgroundColor: 'var(--color-playhead)',
    clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
  };

  const timeLabelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-24px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--color-playhead)',
    color: 'var(--color-white)',
    fontSize: '10px',
    fontFamily: 'var(--font-family-mono)',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div style={containerStyle}>
      <div style={timeLabelStyle}>{formatTime(time)}</div>
      <div style={headStyle} />
      <div style={lineStyle} />
    </div>
  );
};
