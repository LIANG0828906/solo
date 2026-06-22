import React, { useState } from 'react';
import { getAvatarColor } from '../utils/colorHash';
import { formatLastActive, isUserOnline } from '../utils/dateUtils';
import type { User } from '../types';
import '../styles/MemberAvatar.css';

interface MemberAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

export function MemberAvatar({ user, size = 'md', showStatus = false }: MemberAvatarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const bgColor = getAvatarColor(user.id);
  const firstChar = user.name.charAt(0);
  const online = isUserOnline(user.lastActive);

  const sizeClasses = {
    sm: '32px',
    md: '48px',
    lg: '64px',
  };

  return (
    <div
      className="member-avatar"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`member-avatar__circle member-avatar--${size}`}
        style={{
          backgroundColor: bgColor,
          width: sizeClasses[size],
          height: sizeClasses[size],
        }}
      >
        <span className="member-avatar__text">{firstChar}</span>
      </div>
      {showStatus && (
        <span
          className={`member-avatar__status ${online ? 'member-avatar__status--online' : ''}`}
        />
      )}
      {showTooltip && (
        <div className="member-avatar__tooltip">
          <div className="member-avatar__tooltip-name">{user.name}</div>
          {user.lastActive && (
            <div className="member-avatar__tooltip-time">
              {formatLastActive(user.lastActive)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
