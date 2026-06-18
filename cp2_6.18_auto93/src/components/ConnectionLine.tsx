import React from 'react';
import type { Connection, Component, Screen } from '../types';

interface ConnectionLineProps {
  connection: Connection;
  fromComponent: Component | undefined;
  toScreen: Screen | undefined;
  isPreview?: boolean;
  onClick?: () => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  fromComponent,
  toScreen,
  isPreview = false,
  onClick,
}) => {
  if (!fromComponent) return null;

  const fromX = fromComponent.x + fromComponent.width / 2;
  const fromY = fromComponent.y + fromComponent.height;

  const toX = toScreen ? 500 : fromX + 100;
  const toY = toScreen ? -40 : fromY + 80;

  const controlY = fromY + Math.abs(toY - fromY) * 0.5;
  const path = `M ${fromX} ${fromY} C ${fromX} ${controlY}, ${toX} ${controlY}, ${toX} ${toY}`;

  const arrowSize = 8;
  const arrowPath = `M ${toX} ${toY} l ${-arrowSize} ${-arrowSize} m ${arrowSize} ${arrowSize} l ${arrowSize} ${-arrowSize}`;

  return (
    <g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <defs>
        <linearGradient
          id={`gradient-${connection.id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#6366F1" stopOpacity="1" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="1" />
        </linearGradient>
        {!isPreview && (
          <filter id={`glow-${connection.id}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <path
        d={path}
        fill="none"
        stroke={`url(#gradient-${connection.id})`}
        strokeWidth="2"
        strokeLinecap="round"
        filter={!isPreview ? `url(#glow-${connection.id})` : undefined}
      />

      <path
        d={path}
        fill="none"
        stroke="#A5B4FC"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="8 12"
        className="animate-flow"
        opacity="0.5"
      />

      <path
        d={arrowPath}
        fill="none"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {toScreen && (
        <g transform={`translate(${toX - 60}, ${toY - 28})`}>
          <rect
            width="120"
            height="24"
            rx="4"
            fill="#7C3AED"
            className="animate-pulse"
          />
          <text
            x="60"
            y="16"
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontWeight="500"
          >
            {toScreen.name}
          </text>
        </g>
      )}
    </g>
  );
};
