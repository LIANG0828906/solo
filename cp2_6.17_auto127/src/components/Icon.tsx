import React from 'react';
import type { IconKey } from '../types';

interface IconProps {
  type: IconKey;
  color?: string;
  className?: string;
}

export const IconComponent: React.FC<IconProps> = ({ type, color = '#FFFFFF', className }) => {
  const commonProps = {
    fill: color,
    className,
    viewBox: '0 0 24 24',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  switch (type) {
    case 'star':
      return (
        <svg {...commonProps}>
          <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1L12 2z" />
        </svg>
      );
    case 'circle':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'square':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
    case 'triangle':
      return (
        <svg {...commonProps}>
          <path d="M12 2L23 21H1L12 2z" />
        </svg>
      );
  }
};

export default IconComponent;
