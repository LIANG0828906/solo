import React, { useState } from 'react';
import type { User } from '@/types';

interface UserPresenceProps {
  users: User[];
  currentUserId: string;
}

const avatarColors = [
  '#E3F2FD',
  '#FFEBEE',
  '#E8F5E9',
  '#FFF3E0',
  '#F3E5F5',
  '#E0F7FA',
  '#FFF9C4',
  '#FCE4EC',
];

const textColors = [
  '#1565C0',
  '#C62828',
  '#2E7D32',
  '#E65100',
  '#6A1B9A',
  '#00695C',
  '#F57F17',
  '#AD1457',
];

export default function UserPresence({ users, currentUserId }: UserPresenceProps) {
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

  const displayUsers = users.slice(0, 4);
  const remainingCount = users.length - displayUsers.length;

  const getAvatarColor = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;
    return {
      bg: avatarColors[index],
      text: textColors[index],
    };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 100,
      }}
    >
      {displayUsers.map((user, index) => {
        const colors = getAvatarColor(user.id);
        const isCurrentUser = user.id === currentUserId;
        return (
          <div
            key={user.id}
            style={{
              position: 'relative',
              marginLeft: index > 0 ? '-10px' : '0',
              zIndex: displayUsers.length - index,
            }}
            onMouseEnter={() => setHoveredUserId(user.id)}
            onMouseLeave={() => setHoveredUserId(null)}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: colors.bg,
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: "'Roboto', sans-serif",
                border: isCurrentUser ? '2px solid #2196F3' : '2px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                cursor: 'default',
                transform: hoveredUserId === user.id ? 'translateY(-2px) scale(1.1)' : 'none',
              }}
            >
              {getInitials(user.name)}
            </div>
            {isCurrentUser && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#2196F3',
                  border: '2px solid #FFFFFF',
                }}
              />
            )}
            {hoveredUserId === user.id && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#212121',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: "'Roboto', sans-serif",
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  zIndex: 1000,
                }}
              >
                {user.name}
                {isCurrentUser && ' (你)'}
              </div>
            )}
          </div>
        );
      })}
      {remainingCount > 0 && (
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#EEEEEE',
            color: '#616161',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: "'Roboto', sans-serif",
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            marginLeft: '-10px',
            transition: 'all 0.2s ease',
          }}
        >
          +{remainingCount}
        </div>
      )}
      <div
        style={{
          marginLeft: '8px',
          padding: '4px 10px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#616161',
          fontFamily: "'Roboto', sans-serif",
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }}
      >
        {users.length} 在线
      </div>
    </div>
  );
}
