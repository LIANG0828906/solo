import React from 'react';
import type { TeaVariety } from '../types';

const varietyColors: Record<TeaVariety, string> = {
  '龙井': '#2E7D32',
  '碧螺春': '#558B2F',
  '铁观音': '#689F38',
  '普洱': '#33691E',
  '大红袍': '#827717',
};

export const TeaLeafIcon: React.FC<{ variety?: TeaVariety; size?: number }> = ({
  variety = '龙井',
  size = 24,
}) => {
  const color = varietyColors[variety];
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`leafGrad-${variety}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M50,10 C30,10 15,30 15,50 C15,70 30,90 50,90 C70,90 85,70 85,50 C85,30 70,10 50,10 Z"
        fill={`url(#leafGrad-${variety})`}
      />
      <path
        d="M50,15 L50,85"
        stroke="#1B5E20"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M50,30 C40,35 35,45 38,55"
        stroke="#1B5E20"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M50,45 C60,50 65,60 62,70"
        stroke="#1B5E20"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
};

export const TeapotIcon: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="teapotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF8E7" />
          <stop offset="100%" stopColor="#8BC34A" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="35" rx="25" ry="8" fill="#2E7D32" />
      <rect x="35" y="25" width="30" height="8" rx="2" fill="#2E7D32" />
      <path
        d="M20,40 Q20,70 50,75 Q80,70 80,40 Z"
        fill="url(#teapotGrad)"
        stroke="#2E7D32"
        strokeWidth="2"
      />
      <path
        d="M15,45 Q5,45 8,55 Q10,60 18,58"
        fill="none"
        stroke="#2E7D32"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M82,48 Q95,50 92,58 Q88,65 80,62"
        fill="none"
        stroke="#2E7D32"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="50" cy="60" r="3" fill="#1B5E20" />
      <path
        d="M45,55 Q50,52 55,55"
        fill="none"
        stroke="#1B5E20"
        strokeWidth="1.5"
      />
    </svg>
  );
};
