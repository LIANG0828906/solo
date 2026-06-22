import React from 'react';
import { User } from '../types';

interface CursorAtLine {
  user: User;
  charIndex: number;
  lineIndex: number;
}

interface LyricLineProps {
  lineIndex: number;
  text: string;
  timestamp?: string;
  lineRef: React.RefObject<HTMLDivElement>;
  isActive: boolean;
  cursors: CursorAtLine[];
  onMouseDown: (e: React.MouseEvent) => void;
  onClickTimestamp?: () => void;
  onTimestampClick?: (e: React.MouseEvent) => void;
  isDraggingTimestamp?: boolean;
}

const LyricLine: React.FC<LyricLineProps> = ({
  lineIndex,
  text,
  timestamp,
  lineRef,
  isActive,
  cursors,
  onMouseDown,
  onClickTimestamp,
  onTimestampClick,
}) => {
  const charWidth = 9.6;

  const groupedCursors: Record<number, CursorAtLine[]> = {};
  cursors.forEach((c) => {
    if (!groupedCursors[c.charIndex]) groupedCursors[c.charIndex] = [];
    groupedCursors[c.charIndex].push(c);
  });

  return (
    <div
      ref={lineRef}
      className="fade-in"
      onMouseDown={onMouseDown}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        minHeight: 'calc(16px * 1.8)',
        lineHeight: 1.8,
        backgroundColor: isActive ? '#FFF3CD' : 'transparent',
        borderRadius: 4,
        transition: 'background-color 0.2s',
        padding: '0 8px 0 0',
        fontWeight: isActive ? 700 : 400,
      }}
    >
      <div
        style={{
          width: 52,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          paddingTop: 1,
          gap: 6,
          paddingLeft: 12,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: '#9ca3af',
            fontFamily: "'Fira Code', monospace",
            minWidth: 24,
            userSelect: 'none',
          }}
        >
          {String(lineIndex + 1).padStart(2, '0')}
        </span>
        {timestamp && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onTimestampClick?.(e);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onClickTimestamp?.();
            }}
            title="拖动调整位置，双击删除"
            style={{
              fontSize: 11,
              color: '#6366f1',
              fontFamily: "'Fira Code', monospace",
              backgroundColor: '#eef2ff',
              padding: '1px 5px',
              borderRadius: 4,
              cursor: 'grab',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {timestamp}
          </span>
        )}
      </div>
      <div
        style={{
          position: 'relative',
          flex: 1,
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          fontSize: 16,
          color: '#1f2937',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          paddingLeft: 8,
          paddingRight: 8,
        }}
      >
        {text || '\u200B'}
        {Object.entries(groupedCursors).map(([charIdxStr, cursorGroup]) => {
          const charIdx = parseInt(charIdxStr, 10);
          return (
            <React.Fragment key={`cursor-group-${charIdx}`}>
              {cursorGroup.map((cursor, offsetInGroup) => (
                <div
                  key={cursor.user.id}
                  style={{
                    position: 'absolute',
                    left: `calc(8px + ${charIdx * charWidth}px)`,
                    top: 0,
                    pointerEvents: 'none',
                    zIndex: 10,
                    transform: `translateX(${offsetInGroup * 2}px)`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: 0,
                      width: 2,
                      height: 'calc(16px * 1.8)',
                      backgroundColor: cursor.user.color,
                      animation: 'cursorBlink 1s step-end infinite',
                      boxShadow: `0 0 4px ${cursor.user.color}50`,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(16px * 1.8 + 4px)',
                      left: -4,
                      transform: `translateX(-${offsetInGroup * 50}%)`,
                      backgroundColor: `${cursor.user.color}cc`,
                      color: '#fff',
                      fontSize: 12,
                      padding: '2px 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {cursor.user.nickname}
                  </div>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LyricLine;
