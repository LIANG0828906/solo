import React from 'react';
import type { User } from '../utils/types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  tooltipText?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-sm',
  md: 'w-9 h-9 text-base',
  lg: 'w-12 h-12 text-xl',
};

const tooltipPositionClasses = {
  sm: 'mb-1.5',
  md: 'mb-2',
  lg: 'mb-2.5',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showTooltip = true,
  tooltipText,
}) => {
  const displayTooltipText = tooltipText || user.name;

  return (
    <div className="avatar-container relative inline-block group/avatar">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium shadow-sm border-[2.5px] border-white select-none cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95`}
        style={{
          backgroundColor: user.color,
          boxShadow: `0 2px 8px ${user.color}40`,
        }}
      >
        <span className="leading-none flex items-center justify-center">
          {user.avatar}
        </span>
      </div>

      {showTooltip && (
        <div
          className={`avatar-tooltip absolute bottom-full left-1/2 -translate-x-1/2 ${tooltipPositionClasses[size]} px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-[9999] font-medium shadow-xl pointer-events-none transition-all duration-200 origin-bottom`}
        >
          {displayTooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-px">
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid #1f2937',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
