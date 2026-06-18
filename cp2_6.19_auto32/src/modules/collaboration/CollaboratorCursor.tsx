import React from 'react';
import { Collaborator } from '../../types';

interface CollaboratorCursorProps {
  collaborator: Collaborator;
}

export const CollaboratorCursor: React.FC<CollaboratorCursorProps> = ({ collaborator }) => {
  const now = Date.now();
  const isBlinking = now - collaborator.lastBlinkTime < 500;

  return (
    <div
      style={{
        position: 'absolute',
        left: collaborator.cursorX,
        top: collaborator.cursorY,
        pointerEvents: 'none',
        zIndex: 100,
        transform: 'translate(-2px, -2px)',
        transition: 'left 0.08s cubic-bezier(0.4, 0, 0.2, 1), top 0.08s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block' }}>
        <path
          d="M2 2 L14 8 L10 10 L8 14 Z"
          fill={collaborator.color}
          stroke="#fff"
          strokeWidth="1"
          style={{
            filter: isBlinking
              ? `drop-shadow(0 0 8px ${collaborator.color}) drop-shadow(0 0 16px ${collaborator.color})`
              : `drop-shadow(0 0 4px ${collaborator.color}80)`,
          }}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 14,
          padding: '2px 8px',
          backgroundColor: collaborator.color,
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          borderRadius: 4,
          whiteSpace: 'nowrap',
          boxShadow: isBlinking
            ? `0 0 12px ${collaborator.color}, 0 4px 8px rgba(0,0,0,0.4)`
            : '0 2px 6px rgba(0,0,0,0.4)',
          opacity: isBlinking ? 1 : 0.9,
          transition: 'opacity 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {collaborator.avatar} {collaborator.name}
      </div>

      {isBlinking && (
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: -8,
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: collaborator.color,
            opacity: 0.3,
            animation: 'pulse 0.5s ease-out',
          }}
        />
      )}
    </div>
  );
};
