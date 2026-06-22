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

const icons: Record<string, string> = {
  problem: '❓',
  solution: '💡',
  action: '✅',
};

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
      className={`group-zone absolute rounded-2xl p-5 transition-all duration-400 ease-out ${
        isHovered ? 'hover group-highlight' : 'group-zone-waiting'
      }`}
      style={{
        ...style,
        backgroundColor: isHovered ? zone.color : `${zone.color}35`,
        borderWidth: isHovered ? '3px' : '2px',
        borderStyle: isHovered ? 'solid' : 'dashed',
        borderColor: isHovered ? zone.borderColor : '#B8B8B8',
        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
        zIndex: isHovered ? 10 : 1,
        boxShadow: isHovered
          ? `0 15px 50px ${zone.borderColor}40, 0 5px 20px rgba(0,0,0,0.08), inset 0 0 30px ${zone.borderColor}25`
          : '0 2px 10px rgba(0,0,0,0.03)',
        backdropFilter: isHovered ? 'blur(2px)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-col h-full">
        <div className="text-center mb-4">
          <div className={`text-4xl mb-2 transition-transform duration-300 ${
            isHovered ? 'scale-125 -translate-y-1' : ''
          }`}>
            {icons[zone.id] || '📌'}
          </div>
          <h3
            className="font-serif-sc text-xl font-bold tracking-wide"
            style={{
              color: zone.borderColor,
              textShadow: isHovered ? `0 2px 10px ${zone.borderColor}30` : 'none',
              transition: 'all 0.3s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {zone.title}
          </h3>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                isHovered ? 'scale-110' : ''
              }`}
              style={{
                backgroundColor: isHovered ? zone.borderColor : `${zone.borderColor}50`,
                color: isHovered ? '#FFFFFF' : '#666666',
              }}
            >
              {notesInZone.length} 张便签
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center">
          {notesInZone.length > 0 ? (
            <div className="w-full space-y-1.5 opacity-60">
              {notesInZone.slice(0, 3).map(note => (
                <div
                  key={note.id}
                  className="w-full truncate text-xs text-gray-600 px-3 py-1.5 rounded-lg bg-white/40"
                  style={{
                    borderLeft: `3px solid ${zone.borderColor}`,
                  }}
                >
                  {note.content || '(空便签)'}
                </div>
              ))}
              {notesInZone.length > 3 && (
                <p className="text-xs text-gray-500 text-center italic">
                  +{notesInZone.length - 3} 更多...
                </p>
              )}
            </div>
          ) : (
            <div className={`text-center transition-all duration-300 ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-50'
            }`}>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-dashed transition-all duration-300"
                style={{
                  borderColor: isHovered ? zone.borderColor : '#CCCCCC',
                  backgroundColor: isHovered ? 'rgba(255,255,255,0.5)' : 'transparent',
                }}
              >
                <span className={`text-2xl transition-transform duration-300 ${
                  isHovered ? 'scale-125' : ''
                }`}>
                  +
                </span>
              </div>
              <p
                className="text-xs font-medium transition-colors duration-300"
                style={{
                  color: isHovered ? zone.borderColor : '#999999',
                }}
              >
                {isHovered ? '松开即可放入此分组' : '拖拽便签到此处'}
              </p>
            </div>
          )}
        </div>

        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-t-full transition-all duration-400 ${
            isHovered ? 'opacity-100 w-24' : 'opacity-40'
          }`}
          style={{
            backgroundColor: zone.borderColor,
          }}
        />
      </div>
    </div>
  );
};
