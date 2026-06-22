import React from 'react';
import { useStore, PRESET_CHARACTERS } from '@/store/useStore';

interface CharacterTrayProps {
  onDragStartCharacter: (preset: typeof PRESET_CHARACTERS[number]) => void;
}

export const CharacterTray: React.FC<CharacterTrayProps> = ({ onDragStartCharacter }) => {
  return (
    <div
      className="fixed z-30 p-4 rounded-2xl shadow-xl"
      style={{
        top: '120px',
        right: '24px',
        backgroundColor: '#FFF8E7',
        border: '3px solid #4A2C2A',
      }}
    >
      <h4
        className="font-bangers text-lg mb-3 text-center"
        style={{ color: '#4A2C2A' }}
      >
        🎭 角色库
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {PRESET_CHARACTERS.map((preset) => (
          <div
            key={preset.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'copy';
              e.dataTransfer.setData('application/preset-character', preset.type);
              onDragStartCharacter(preset);
            }}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:scale-105"
            style={{
              backgroundColor: 'white',
              border: '2px solid #4A2C2A',
              minWidth: '72px',
            }}
          >
            <span className="text-3xl select-none">{preset.emoji}</span>
            <span className="text-xs font-medium" style={{ color: '#4A2C2A' }}>
              {preset.name}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-center mt-3 opacity-70" style={{ color: '#4A2C2A' }}>
        拖拽到画布上
      </p>
    </div>
  );
};
