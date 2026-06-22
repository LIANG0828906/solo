import React from 'react';
import type { Clip, Sample } from '../types';
import { TRACK_HEIGHT, PIXELS_PER_SECOND_BASE, GRID_INTERVAL } from '../types';

interface TrackItemProps {
  clip: Clip;
  sample: Sample | undefined;
  zoom: number;
  isSelected: boolean;
  trackIndex: number;
  onSelect: () => void;
  onMove: (start: number) => void;
  onFadeInChange: (value: number) => void;
  onFadeOutChange: (value: number) => void;
  onDelete: () => void;
}

export const TrackItem: React.FC<TrackItemProps> = ({
  clip,
  sample,
  zoom,
  isSelected,
  trackIndex,
  onSelect,
  onMove,
  onFadeInChange,
  onFadeOutChange,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartX, setDragStartX] = React.useState(0);
  const [dragStartPos, setDragStartPos] = React.useState(0);
  const [fadeHandle, setFadeHandle] = React.useState<'in' | 'out' | null>(null);

  const pixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;
  const left = clip.start * pixelsPerSecond;
  const width = clip.duration * pixelsPerSecond;

  const snapToGrid = (time: number): number => {
    return Math.round(time / GRID_INTERVAL) * GRID_INTERVAL;
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'fade-in' | 'fade-out') => {
    e.stopPropagation();
    e.preventDefault();

    if (type === 'move') {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartPos(clip.start);
    } else if (type === 'fade-in') {
      setFadeHandle('in');
      setDragStartX(e.clientX);
      setDragStartPos(clip.fadeIn);
    } else if (type === 'fade-out') {
      setFadeHandle('out');
      setDragStartX(e.clientX);
      setDragStartPos(clip.fadeOut);
    }

    onSelect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartX;
      const deltaTime = deltaX / pixelsPerSecond;

      if (type === 'move') {
        let newStart = dragStartPos + deltaTime;
        newStart = Math.max(0, snapToGrid(newStart));
        onMove(newStart);
      } else if (type === 'fade-in') {
        let newFade = dragStartPos + deltaTime;
        newFade = Math.max(0, Math.min(clip.duration * 0.5, newFade));
        onFadeInChange(newFade);
      } else if (type === 'fade-out') {
        let newFade = dragStartPos - deltaTime;
        newFade = Math.max(0, Math.min(clip.duration * 0.5, newFade));
        onFadeOutChange(newFade);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setFadeHandle(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) {
      onDelete();
    }
  };

  const itemStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${left}px`,
    top: '8px',
    width: `${width}px`,
    height: `${TRACK_HEIGHT - 16}px`,
    backgroundColor: sample?.color || 'var(--color-accent)',
    borderRadius: '6px',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
    boxShadow: isSelected
      ? '0 0 0 2px var(--color-white), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 6px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    userSelect: 'none',
  };

  const gradientOverlay = `
    linear-gradient(180deg, 
      rgba(255,255,255,0.1) 0%, 
      rgba(0,0,0,0.1) 100%
    )
  `;

  const contentStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: gradientOverlay,
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--color-white)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  };

  const fadeHandleStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '12px',
    height: '12px',
    backgroundColor: 'var(--color-white)',
    border: `2px solid ${isActive ? 'var(--color-accent)' : sample?.color || 'var(--color-accent)'}`,
    borderRadius: '50%',
    cursor: 'ew-resize',
    zIndex: 10,
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 0 8px rgba(59, 130, 246, 0.6)' : '0 1px 3px rgba(0,0,0,0.3)',
  });

  const fadeInAreaStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: `${Math.max(0, clip.fadeIn * pixelsPerSecond)}px`,
    background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
    pointerEvents: 'none',
  };

  const fadeOutAreaStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: `${Math.max(0, clip.fadeOut * pixelsPerSecond)}px`,
    background: 'linear-gradient(-90deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
    pointerEvents: 'none',
  };

  const waveformStyle: React.CSSProperties = {
    position: 'absolute',
    left: '8px',
    right: '8px',
    top: '50%',
    height: '20px',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    opacity: 0.6,
  };

  const generateWaveform = () => {
    const bars = Math.floor(width / 6);
    return Array.from({ length: bars }, (_, i) => {
      const phase = (i / bars) * Math.PI * 4;
      const height = 4 + Math.abs(Math.sin(phase + trackIndex)) * 12;
      return (
        <div
          key={i}
          style={{
            width: '2px',
            height: `${height}px`,
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderRadius: '1px',
          }}
        />
      );
    });
  };

  return (
    <div
      style={itemStyle}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onDoubleClick={handleDoubleClick}
    >
      <div style={contentStyle}>
        <div style={waveformStyle}>{generateWaveform()}</div>
        {width > 60 && <div style={nameStyle}>{sample?.name || '音频片段'}</div>}
      </div>

      <div style={fadeInAreaStyle} />
      <div style={fadeOutAreaStyle} />

      {width > 40 && (
        <>
          <div
            style={{ ...fadeHandleStyle(fadeHandle === 'in'), left: '-6px' }}
            onMouseDown={(e) => handleMouseDown(e, 'fade-in')}
            title="淡入"
          />
          <div
            style={{ ...fadeHandleStyle(fadeHandle === 'out'), right: '-6px' }}
            onMouseDown={(e) => handleMouseDown(e, 'fade-out')}
            title="淡出"
          />
        </>
      )}
    </div>
  );
};
