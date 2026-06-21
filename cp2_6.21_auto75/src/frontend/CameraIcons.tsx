import React from 'react';
import type { CameraType } from '../types';

interface IconProps {
  size?: number;
}

export const CameraIconSvg: React.FC<{ type: CameraType; size?: number }> = ({ type, size = 24 }) => {
  const stroke = 'currentColor';
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (type) {
    case 'fixed':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M8 6V4h8v2" />
          <circle cx="12" cy="12.5" r="3" />
        </svg>
      );
    case 'push':
      return (
        <svg {...common}>
          <path d="M4 18L9 13" />
          <path d="M9 13H4V8" />
          <rect x="11" y="5" width="10" height="14" rx="1.5" />
          <path d="M14 9l1 1" />
          <path d="M18 9l-1 1" />
          <path d="M14 15l1-1" />
          <path d="M18 15l-1-1" />
        </svg>
      );
    case 'pull':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="10" height="14" rx="1.5" />
          <path d="M7 9l1 1" />
          <path d="M11 9l-1 1" />
          <path d="M7 15l1-1" />
          <path d="M11 15l-1-1" />
          <path d="M18 6l3 3" />
          <path d="M21 6v3h-3" />
        </svg>
      );
    case 'pan':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M5 12H2" />
          <path d="M22 12h-3" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="M5.6 5.6l-2.1 2.1" />
          <path d="M20.5 3.5L18.4 5.6" />
          <path d="M5.6 18.4l-2.1 2.1" />
          <path d="M18.4 18.4l2.1 2.1" />
        </svg>
      );
    case 'move':
      return (
        <svg {...common}>
          <path d="M4 12h16" />
          <path d="M16 8l4 4-4 4" />
          <path d="M8 8L4 12l4 4" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <rect x="9" y="17" width="6" height="4" rx="1" />
        </svg>
      );
    case 'follow':
      return (
        <svg {...common}>
          <path d="M3 16l4-4 4 4 4-6 4 6" />
          <circle cx="19" cy="5" r="2.5" />
          <path d="M19 7.5V10" />
          <rect x="2" y="18" width="20" height="3" rx="1" fill={stroke} stroke="none" opacity="0.2" />
        </svg>
      );
    case 'lowAngle':
      return (
        <svg {...common}>
          <path d="M3 20L12 4l9 16" />
          <path d="M6 17h12" />
          <path d="M8.5 13h7" />
          <path d="M12 7L12 11" strokeDasharray="1 2" />
        </svg>
      );
    case 'highAngle':
      return (
        <svg {...common}>
          <path d="M3 4L12 20 21 4" />
          <path d="M6 7h12" />
          <path d="M8.5 11h7" />
          <path d="M12 13L12 17" strokeDasharray="1 2" />
        </svg>
      );
    default:
      return null;
  }
};

export const CameraIconMap: { type: NonNullable<CameraType>; label: string }[] = [
  { type: 'fixed', label: '固定' },
  { type: 'push', label: '推' },
  { type: 'pull', label: '拉' },
  { type: 'pan', label: '摇' },
  { type: 'move', label: '移' },
  { type: 'follow', label: '跟' },
  { type: 'lowAngle', label: '仰拍' },
  { type: 'highAngle', label: '俯拍' },
];
