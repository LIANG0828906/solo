import React, { useState, useMemo } from 'react';
import type { Connection, Card } from '../types';
import { CARD_COLORS } from '../types';

interface ConnectionLineProps {
  connection: Connection;
  fromCard: Card;
  toCard: Card;
  scale: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function blendColors(hex1: string, hex2: string): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex((r1 + r2) / 2, (g1 + g2) / 2, (b1 + b2) / 2);
}

const CARD_WIDTH = 180;
const CARD_HEIGHT = 100;

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  fromCard,
  toCard,
  scale,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const fromColor = CARD_COLORS[fromCard.color]?.hex || '#FB7185';
  const toColor = CARD_COLORS[toCard.color]?.hex || '#FB7185';
  const midColor = useMemo(() => blendColors(fromColor, toColor), [fromColor, toColor]);

  const x1 = fromCard.x + CARD_WIDTH / 2;
  const y1 = fromCard.y + CARD_HEIGHT;
  const x2 = toCard.x + CARD_WIDTH / 2;
  const y2 = toCard.y;

  const dy = y2 - y1;
  const cpOffset = Math.max(Math.abs(dy) * 0.5, 40);
  const cpY1 = y1 + cpOffset;
  const cpY2 = y2 - cpOffset;

  const pathD = `M ${x1} ${y1} C ${x1} ${cpY1}, ${x2} ${cpY2}, ${x2} ${y2}`;

  const arrowSize = 8;
  const angle = Math.atan2(y2 - cpY2, x2 - x2) || Math.PI / 2;
  const ax1 = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
  const ay1 = y2 - arrowSize * Math.sin(angle - Math.PI / 6);
  const ax2 = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
  const ay2 = y2 - arrowSize * Math.sin(angle + Math.PI / 6);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      onDelete(connection.id);
    } else {
      onSelect(connection.id);
    }
  };

  const labelX = (x1 + x2) / 2;
  const labelY = (y1 + y2) / 2;

  return (
    <g
      className="connection-line-group"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <defs>
        <linearGradient id={`grad-${connection.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fromColor} />
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke={isSelected || isHovered ? `url(#grad-${connection.id})` : midColor}
        strokeWidth={isSelected ? 3 : 2}
        strokeOpacity={isSelected || isHovered ? 1 : 0.5}
        strokeDasharray={isSelected ? undefined : undefined}
      />
      <polygon
        points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`}
        fill={isSelected || isHovered ? toColor : midColor}
        fillOpacity={isSelected || isHovered ? 1 : 0.6}
      />
      {isHovered && (
        <g>
          <rect
            x={labelX - 80}
            y={labelY - 12}
            width={160}
            height={24}
            rx={6}
            fill="white"
            fillOpacity={0.95}
            stroke={midColor}
            strokeWidth={1}
          />
          <text
            x={labelX}
            y={labelY + 4}
            textAnchor="middle"
            fontSize={11}
            fill="#374151"
            fontWeight={500}
          >
            {fromCard.title} → {toCard.title}
          </text>
        </g>
      )}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
};

export default ConnectionLine;
