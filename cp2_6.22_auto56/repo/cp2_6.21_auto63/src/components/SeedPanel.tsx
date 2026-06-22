import React from 'react';
import { useDrag } from 'react-dnd';
import { PlantType, PLANT_PARAMS } from '../types';

const SEEDS: PlantType[] = ['sunflower', 'tomato', 'rose', 'cactus', 'oak'];

export const SeedPanel: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: '#FFF8E1',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '200px',
        border: '2px solid #FFB74D',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px 0',
          color: '#5D4037',
          fontSize: '18px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        🌱 种子栏
      </h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {SEEDS.map((type) => (
          <SeedItem key={type} type={type} />
        ))}
      </div>
      <p
        style={{
          fontSize: '12px',
          color: '#8D6E63',
          marginTop: '16px',
          textAlign: 'center',
          lineHeight: '1.4',
        }}
      >
        拖拽种子到花园中种植
      </p>
    </div>
  );
};

interface SeedItemProps {
  type: PlantType;
}

const SeedItem: React.FC<SeedItemProps> = ({ type }) => {
  const params = PLANT_PARAMS[type];
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'SEED',
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '12px',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.2s ease',
        border: '2px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = '#8BC34A';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: getSeedColor(type),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          border: '2px solid #8D6E63',
        }}
      >
        {getSeedEmoji(type)}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 'bold',
            color: '#3E2723',
            fontSize: '14px',
          }}
        >
          {params.name}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: '#8D6E63',
            marginTop: '2px',
          }}
        >
          {params.growthCycleTurns} 回合
        </div>
      </div>
    </div>
  );
};

function getSeedColor(type: PlantType): string {
  const colors: Record<PlantType, string> = {
    sunflower: '#FFF59D',
    tomato: '#FFAB91',
    rose: '#F8BBD9',
    cactus: '#C5E1A5',
    oak: '#BCAAA4',
  };
  return colors[type];
}

function getSeedEmoji(type: PlantType): string {
  const emojis: Record<PlantType, string> = {
    sunflower: '🌻',
    tomato: '🍅',
    rose: '🌹',
    cactus: '🌵',
    oak: '🌳',
  };
  return emojis[type];
}
