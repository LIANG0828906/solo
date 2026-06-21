import { useRef, useState, useCallback } from 'react';
import type { PlayNoteCallback } from './types';
import { getNoteName } from './types';

interface GesturePadProps {
  onPlayNote: PlayNoteCallback;
}

const KEY_COUNT = 12;

export default function GesturePad({ onPlayNote }: GesturePadProps) {
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const lastTriggeredRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const triggerNote = useCallback((pitch: number) => {
    if (lastTriggeredRef.current === pitch) return;
    lastTriggeredRef.current = pitch;
    onPlayNote(pitch, 0.8);
    setActiveKeys(prev => new Set(prev).add(pitch));
    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(pitch);
        return next;
      });
    }, 150);
  }, [onPlayNote]);

  const handleMouseDown = useCallback((pitch: number) => {
    isDraggingRef.current = true;
    triggerNote(pitch);
  }, [triggerNote]);

  const handleMouseEnter = useCallback((pitch: number) => {
    if (isDraggingRef.current) {
      triggerNote(pitch);
    }
  }, [triggerNote]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    lastTriggeredRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    lastTriggeredRef.current = null;
  }, []);

  return (
    <div
      style={{
        flex: '1.5',
        display: 'flex',
        flexDirection: 'column',
        background: '#1E293B',
        borderRadius: '12px',
        padding: '16px',
        margin: '16px',
        marginBottom: '8px',
        minHeight: 0
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          color: '#E2E8F0',
          fontSize: '14px',
          marginBottom: '12px',
          textAlign: 'center',
          opacity: 0.8
        }}
      >
        点击或拖拽钢琴键演奏
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          minHeight: 0
        }}
      >
        {Array.from({ length: KEY_COUNT }, (_, i) => i).map(pitch => {
          const isActive = activeKeys.has(pitch);
          const progress = pitch / (KEY_COUNT - 1);
          const startColor = [59, 130, 246];
          const endColor = [29, 78, 216];
          const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * progress);
          const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * progress);
          const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * progress);
          const bgColor = `rgb(${r}, ${g}, ${b})`;
          const darkerColor = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;

          return (
            <div
              key={pitch}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '80px',
                minWidth: '40px',
                aspectRatio: '1 / 4',
                borderRadius: '4px',
                background: `linear-gradient(180deg, ${bgColor} 0%, ${darkerColor} 100%)`,
                cursor: 'pointer',
                userSelect: 'none',
                transform: isActive ? 'scale(0.9)' : 'scale(1)',
                boxShadow: isActive
                  ? '0 4px 8px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                  : '0 2px 4px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease-out',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '12px'
              }}
              onMouseDown={() => handleMouseDown(pitch)}
              onMouseEnter={() => handleMouseEnter(pitch)}
            >
              <span
                style={{
                  color: '#E2E8F0',
                  fontSize: '11px',
                  fontWeight: 600,
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                  opacity: 0.9
                }}
              >
                {getNoteName(pitch)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
