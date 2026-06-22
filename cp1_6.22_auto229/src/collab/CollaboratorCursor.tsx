import React from 'react';
import type { Collaborator } from '../types';

interface CollaboratorCursorProps {
  collaborator: Collaborator;
  scrollLeft: number;
  scrollTop: number;
}

export const CollaboratorCursor: React.FC<CollaboratorCursorProps> = ({
  collaborator,
  scrollLeft,
  scrollTop,
}) => {
  if (!collaborator.cursor) return null;

  const cursorStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${collaborator.cursor.x - scrollLeft}px`,
    top: `${collaborator.cursor.y - scrollTop}px`,
    pointerEvents: 'none',
    zIndex: 200,
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '-4px',
    backgroundColor: collaborator.color,
    color: 'var(--color-white)',
    fontSize: '10px',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: '12px',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--color-white)',
    borderRadius: '50%',
    animation: 'pulse 1s ease-in-out infinite',
  };

  const getInitials = (name: string): string => {
    return name
      .split(/[\s_-]/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={cursorStyle}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: `drop-shadow(0 2px 4px ${collaborator.color}40)` }}
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"
          fill={collaborator.color}
          stroke="var(--color-white)"
          strokeWidth="1"
        />
      </svg>
      <div style={labelStyle}>
        <span style={dotStyle} />
        <span>{getInitials(collaborator.name)}</span>
      </div>
    </div>
  );
};
