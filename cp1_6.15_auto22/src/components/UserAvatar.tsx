import React from 'react';
import type { User } from '../utils/types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  showTooltip = true 
}) => {
  return (
    <div className="avatar-container relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium shadow-sm border-2 border-white select-none`}
        style={{ backgroundColor: user.color }}
        title={showTooltip ? user.name : undefined}
      >
        <span className="leading-none">{user.avatar}</span>
      </div>
      {showTooltip && (
        <div className="avatar-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
          {user.name}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};
