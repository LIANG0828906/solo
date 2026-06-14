import React from 'react';
import { GROUP_ZONES } from '../utils/types';
import type { Note } from '../utils/types';

interface GroupZoneProps {
  zone: typeof GROUP_ZONES[number];
  style: React.CSSProperties;
  isHovered: boolean;
  notesInZone: Note[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const GroupZone: React.FC<GroupZoneProps> = ({
  zone,
  style,
  isHovered,
  notesInZone,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      className={`group-zone absolute rounded-xl border-2 border-dashed p-4 transition-all duration-300 ${
        isHovered ? 'hover group-highlight' : ''
      }`}
      style={{
        ...style,
        backgroundColor: isHovered ? zone.color : `${zone.color}30`,
        borderColor: isHovered ? zone.borderColor : '#CCCCCC',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="text-center mb-3">
        <h3 
          className="font-serif-sc text-lg font-semibold"
          style={{ color: zone.borderColor }}
        >
          {zone.title}
        </h3>
        <span className="text-xs text-gray-500">
          {notesInZone.length} 张便签
        </span>
      </div>
      <div className="text-center text-xs text-gray-400 mt-auto">
        拖拽便签到此处
      </div>
    </div>
  );
};
