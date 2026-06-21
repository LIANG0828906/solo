import React from 'react';
import type { User } from '@/types';

interface CursorsProps {
  users: User[];
  currentUserId: string;
}

const cursorColors = [
  '#2196F3',
  '#F44336',
  '#4CAF50',
  '#FF9800',
  '#9C27B0',
  '#00BCD4',
  '#FFC107',
  '#E91E63',
];

export default function Cursors({ users, currentUserId }: CursorsProps) {
  const otherUsers = users.filter(
    (user) => user.id !== currentUserId && user.cursorX !== undefined && user.cursorY !== undefined
  );

  const getCursorColor = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % cursorColors.length;
    return cursorColors[index];
  };

  return (
    <g>
      {otherUsers.map((user) => {
        const color = getCursorColor(user.id);
        return (
          <g
            key={user.id}
            transform={`translate(${user.cursorX}, ${user.cursorY})`}
            style={{ transition: 'transform 0.05s linear', pointerEvents: 'none' }}
          >
            <path
              d="M 0 0 L 0 16 L 4 12 L 7 18 L 9.5 16.5 L 6.5 11 L 11 11 Z"
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            <foreignObject x={14} y={-2} width={120} height={24} style={{ overflow: 'visible' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 8px',
                  backgroundColor: color,
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 500,
                  fontFamily: "'Roboto', sans-serif",
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                {user.name}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </g>
  );
}
