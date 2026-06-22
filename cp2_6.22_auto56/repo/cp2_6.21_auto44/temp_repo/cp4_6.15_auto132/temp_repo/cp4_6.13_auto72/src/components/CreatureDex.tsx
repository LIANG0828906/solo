import React, { useState } from 'react';
import { allCreatures, getElementColor, createCreatureInstance } from '../creatures';
import CreatureCard from './CreatureCard';
import { Creature } from '../creatures';

interface CreatureDexProps {
  onCreatureClick: (creature: Creature) => void;
  onDragStart: (e: React.DragEvent, creature: Creature) => void;
  onDragEnd: () => void;
}

const CreatureDex: React.FC<CreatureDexProps> = ({ onCreatureClick, onDragStart, onDragEnd }) => {
  const [filter, setFilter] = useState<string>('all');

  const elements = [
    { id: 'all', name: '全部', emoji: '📚' },
    { id: 'fire', name: '火', emoji: '🔥' },
    { id: 'ice', name: '冰', emoji: '❄️' },
    { id: 'thunder', name: '雷', emoji: '⚡' },
    { id: 'dark', name: '暗', emoji: '🌑' },
    { id: 'light', name: '光', emoji: '✨' },
    { id: 'wind', name: '风', emoji: '🌪️' },
    { id: 'earth', name: '土', emoji: '🪨' },
    { id: 'water', name: '水', emoji: '💧' },
    { id: 'poison', name: '毒', emoji: '☠️' },
  ];

  const filteredCreatures = filter === 'all'
    ? allCreatures
    : allCreatures.filter(c => c.element === filter);

  return (
    <div
      className="w-full h-full flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a1020 0%, #151530 50%, #0a0a20 100%)',
        border: '2px solid #4f46e5',
        boxShadow: '0 0 20px rgba(79, 70, 229, 0.3), inset 0 0 30px rgba(79, 70, 229, 0.05)',
      }}
    >
      <div
        className="px-4 py-3"
        style={{
          background: 'linear-gradient(180deg, rgba(79, 70, 229, 0.3) 0%, transparent 100%)',
          borderBottom: '2px solid #4f46e5',
        }}
      >
        <h3 className="text-indigo-300 font-bold text-lg flex items-center gap-2 mb-2">
          <span>📖</span> 生物图鉴
        </h3>
        <div className="flex flex-wrap gap-1">
          {elements.map(el => (
            <button
              key={el.id}
              onClick={() => setFilter(el.id)}
              className={`px-2 py-1 rounded text-xs font-bold transition-all duration-200 ${
                filter === el.id ? 'scale-105' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                background: filter === el.id
                  ? el.id === 'all'
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : `linear-gradient(135deg, ${getElementColor(el.id)}80, ${getElementColor(el.id)}40)`
                  : 'rgba(255, 255, 255, 0.05)',
                color: filter === el.id ? 'white' : '#9ca3af',
                border: `1px solid ${filter === el.id ? (el.id === 'all' ? '#8b5cf6' : getElementColor(el.id)) : 'transparent'}`,
              }}
            >
              {el.emoji} {el.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-2">
          {filteredCreatures.map(creatureTemplate => {
            const creature = createCreatureInstance(creatureTemplate.id, 1);
            return (
              <div key={creatureTemplate.id} className="flex justify-center">
                <CreatureCard
                  creature={creature}
                  size="small"
                  showHp={false}
                  onClick={() => onCreatureClick(creature)}
                  draggable={true}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="px-4 py-2 text-center text-xs text-gray-500"
        style={{
          borderTop: '1px solid rgba(79, 70, 229, 0.3)',
        }}
      >
        拖拽生物到战场布阵区
      </div>
    </div>
  );
};

export default CreatureDex;
