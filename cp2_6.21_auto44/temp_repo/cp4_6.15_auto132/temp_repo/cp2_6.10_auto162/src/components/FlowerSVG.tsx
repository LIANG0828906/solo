import React from 'react';
import type { PatternType } from '../types/game';

interface FlowerSVGProps {
  pattern: PatternType;
  color: string;
  secondaryColor: string;
  size?: number;
}

export const FlowerSVG: React.FC<FlowerSVGProps> = ({
  pattern,
  color,
  secondaryColor,
  size = 60,
}) => {
  const renderPattern = () => {
    switch (pattern) {
      case 'petal':
        return (
          <g>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <ellipse
                key={i}
                cx="50"
                cy="30"
                rx="12"
                ry="22"
                fill={i % 2 === 0 ? color : secondaryColor}
                transform={`rotate(${angle} 50 50)`}
                opacity="0.9"
              />
            ))}
            <circle cx="50" cy="50" r="10" fill={secondaryColor} />
            <circle cx="50" cy="50" r="5" fill={color} />
          </g>
        );

      case 'spike':
        return (
          <g>
            <path
              d="M50 90 L50 20"
              stroke="#66bb6a"
              strokeWidth="3"
              fill="none"
            />
            {[80, 65, 50, 35].map((y, i) => (
              <g key={i} transform={`translate(0, ${y - 50})`}>
                <ellipse
                  cx="35"
                  cy="50"
                  rx="8"
                  ry="14"
                  fill={color}
                  transform={`rotate(-15 35 50)`}
                  opacity="0.9"
                />
                <ellipse
                  cx="65"
                  cy="50"
                  rx="8"
                  ry="14"
                  fill={secondaryColor}
                  transform={`rotate(15 65 50)`}
                  opacity="0.9"
                />
              </g>
            ))}
            <ellipse cx="50" cy="20" rx="10" ry="18" fill={color} />
          </g>
        );

      case 'radiate':
        return (
          <g>
            {[...Array(12)].map((_, i) => (
              <ellipse
                key={i}
                cx="50"
                cy="25"
                rx="4"
                ry="20"
                fill={i % 2 === 0 ? color : secondaryColor}
                transform={`rotate(${i * 30} 50 50)`}
              />
            ))}
            <circle cx="50" cy="50" r="18" fill={secondaryColor} />
            <circle cx="50" cy="50" r="10" fill={color} />
            <circle cx="50" cy="50" r="5" fill="#5d4037" />
          </g>
        );

      case 'star':
        return (
          <g>
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <polygon
                key={i}
                points="50,15 42,40 58,40"
                fill={color}
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
            <circle cx="50" cy="50" r="12" fill={secondaryColor} />
            <circle cx="50" cy="50" r="6" fill={color} />
          </g>
        );

      case 'heart':
        return (
          <g>
            <path
              d="M50 30 
                 C50 15, 20 15, 20 35 
                 C20 55, 50 75, 50 85 
                 C50 75, 80 55, 80 35 
                 C80 15, 50 15, 50 30"
              fill={color}
            />
            <path
              d="M50 35 
                 C50 25, 30 25, 30 38 
                 C30 50, 50 65, 50 72 
                 C50 65, 70 50, 70 38 
                 C70 25, 50 25, 50 35"
              fill={secondaryColor}
              opacity="0.6"
            />
            <ellipse cx="40" cy="40" rx="4" ry="5" fill="white" opacity="0.5" />
          </g>
        );

      case 'bell':
        return (
          <g>
            <path
              d="M50 20 
                 C30 25, 25 55, 35 75 
                 L50 80 
                 L65 75 
                 C75 55, 70 25, 50 20"
              fill={color}
            />
            <path
              d="M50 25 
                 C38 28, 35 50, 42 68 
                 L50 72 
                 L58 68 
                 C65 50, 62 28, 50 25"
              fill={secondaryColor}
              opacity="0.5"
            />
            <ellipse cx="50" cy="18" rx="8" ry="5" fill="#66bb6a" />
            <circle cx="45" cy="45" r="3" fill="white" opacity="0.6" />
            <circle cx="55" cy="55" r="2" fill="white" opacity="0.4" />
          </g>
        );

      case 'cluster':
        return (
          <g>
            {[
              { x: 40, y: 35, r: 14 },
              { x: 60, y: 35, r: 14 },
              { x: 30, y: 55, r: 12 },
              { x: 50, y: 50, r: 16 },
              { x: 70, y: 55, r: 12 },
              { x: 40, y: 70, r: 11 },
              { x: 60, y: 70, r: 11 },
            ].map((pos, i) => (
              <circle
                key={i}
                cx={pos.x}
                cy={pos.y}
                r={pos.r}
                fill={i % 2 === 0 ? color : secondaryColor}
                opacity="0.9"
              />
            ))}
            <circle cx="50" cy="50" r="8" fill={color} />
          </g>
        );

      case 'feather':
        return (
          <g>
            <path
              d="M50 90 L50 15"
              stroke="#66bb6a"
              strokeWidth="2"
              fill="none"
            />
            {[80, 70, 60, 50, 40, 30].map((y, i) => (
              <g key={i}>
                <ellipse
                  cx={35 - i * 2}
                  cy={y}
                  rx="15"
                  ry="8"
                  fill={color}
                  transform={`rotate(-20 ${35 - i * 2} ${y})`}
                  opacity={0.9 - i * 0.1}
                />
                <ellipse
                  cx={65 + i * 2}
                  cy={y}
                  rx="15"
                  ry="8"
                  fill={secondaryColor}
                  transform={`rotate(20 ${65 + i * 2} ${y})`}
                  opacity={0.9 - i * 0.1}
                />
              </g>
            ))}
            <ellipse cx="50" cy="15" rx="10" ry="15" fill={color} />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'block' }}
    >
      {renderPattern()}
    </svg>
  );
};

export default FlowerSVG;
