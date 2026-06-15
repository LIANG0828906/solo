import React from 'react';
import type { ColorFilter, Note } from '../utils/types';
import { NOTE_COLORS, NOTE_BORDER_COLORS } from '../utils/types';

interface ColorFilterButtonProps {
  color: ColorFilter;
  isActive: boolean;
  count: number;
  onClick: () => void;
}

const colorLabels: Record<ColorFilter, string> = {
  all: '全部',
  red: '问题',
  green: '方案',
  blue: '行动项',
  yellow: '其他',
};

export const ColorFilterButton: React.FC<ColorFilterButtonProps> = ({
  color,
  isActive,
  count,
  onClick,
}) => {
  const bgColor = color === 'all' ? '#FFFFFF' : NOTE_COLORS[color as Note['color']];
  const borderColor = color === 'all' ? '#CCCCCC' : NOTE_BORDER_COLORS[color as Note['color']];

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
        isActive ? 'scale-105 shadow-md' : 'hover:scale-102 opacity-70 hover:opacity-100'
      }`}
      style={{
        backgroundColor: bgColor,
        borderColor: isActive ? borderColor : 'transparent',
      }}
    >
      <span 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: borderColor }}
      />
      <span className="text-sm font-medium text-gray-700">{colorLabels[color]}</span>
      <span className="text-xs font-semibold text-gray-500 bg-white/50 px-1.5 py-0.5 rounded">
        {count}
      </span>
    </button>
  );
};
