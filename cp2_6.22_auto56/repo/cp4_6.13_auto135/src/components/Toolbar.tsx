import React, { useState } from 'react';
import type { BombType } from '../../shared/types';
import {
  getBombColor,
  getBombName,
  getBombDescription,
  calculateExplosionRadius,
  DIRECTIONAL_ANGLE,
} from '../physics/explosion';

interface ToolbarProps {
  selectedType: BombType;
  onSelect: (type: BombType) => void;
  isMyTurn: boolean;
  directionalAngle?: number;
  onDirectionalAngleChange?: (angle: number) => void;
}

const bombTypes: BombType[] = ['basic', 'delayed', 'directional'];

const Toolbar: React.FC<ToolbarProps> = ({
  selectedType,
  onSelect,
  isMyTurn,
  directionalAngle = 0,
  onDirectionalAngleChange,
}) => {
  const [clickedId, setClickedId] = useState<BombType | null>(null);

  const handleClick = (type: BombType) => {
    if (!isMyTurn) return;
    setClickedId(type);
    onSelect(type);
    setTimeout(() => setClickedId(null), 150);
  };

  const getBombShape = (type: BombType) => {
    if (type === 'basic') {
      return (
        <div
          className="rounded-full"
          style={{
            width: 28,
            height: 28,
            backgroundColor: getBombColor(type),
            boxShadow: `0 0 12px ${getBombColor(type)}80`,
          }}
        />
      );
    }
    if (type === 'delayed') {
      return (
        <div
          className="rounded-md"
          style={{
            width: 28,
            height: 28,
            backgroundColor: getBombColor(type),
            boxShadow: `0 0 12px ${getBombColor(type)}80`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1a1a2e',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          T
        </div>
      );
    }
    return (
      <svg width="28" height="28" viewBox="-14 -14 28 28">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polygon
          points="12,0 -6,-8 -6,8"
          fill={getBombColor(type)}
          filter="url(#glow)"
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-3 p-3" style={{ width: 180 }}>
      <div
        className="text-center font-bold mb-1 tracking-widest"
        style={{ color: '#ffd93d', fontSize: 13 }}
      >
        ═══ 工具栏 ═══
      </div>

      {bombTypes.map((type) => {
        const isSelected = selectedType === type;
        const isClicked = clickedId === type;
        const disabled = !isMyTurn;

        return (
          <div
            key={type}
            onClick={() => handleClick(type)}
            className="relative rounded-lg p-3 transition-all cursor-pointer border"
            style={{
              background: isSelected
                ? `linear-gradient(135deg, ${getBombColor(type)}30, #1a1a2e)`
                : '#1a1a2e',
              borderColor: isSelected ? getBombColor(type) : '#6c5ce740',
              opacity: disabled ? 0.4 : 1,
              pointerEvents: disabled ? 'none' : 'auto',
              transform: isClicked ? 'scale(0.92)' : isSelected ? 'scale(1.03)' : 'scale(1)',
              transition: 'all 0.15s ease',
              boxShadow: isSelected
                ? `0 0 20px ${getBombColor(type)}40, inset 0 0 20px ${getBombColor(type)}10`
                : 'none',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(108, 92, 231, 0.1)',
                  border: `1px solid ${getBombColor(type)}40`,
                }}
              >
                {getBombShape(type)}
              </div>
              <div className="flex-1">
                <div
                  className="font-bold text-sm"
                  style={{ color: getBombColor(type) }}
                >
                  {getBombName(type)}
                </div>
                <div
                  className="text-[10px] leading-tight mt-1"
                  style={{ color: '#8888aa' }}
                >
                  {getBombDescription(type)}
                </div>
              </div>
            </div>

            {type === 'directional' && isSelected && onDirectionalAngleChange && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#6c5ce730' }}>
                <div className="text-[10px] mb-2" style={{ color: '#8888aa' }}>
                  朝向角度: {Math.round((directionalAngle * 180) / Math.PI)}°
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={Math.round((directionalAngle * 180) / Math.PI)}
                    onChange={(e) =>
                      onDirectionalAngleChange((parseInt(e.target.value) * Math.PI) / 180)
                    }
                    className="flex-1"
                    style={{ accentColor: getBombColor(type) }}
                  />
                  <svg width="24" height="24" viewBox="-12 -12 24 24">
                    <polygon
                      points="10,0 -5,-6 -5,6"
                      fill={getBombColor(type)}
                      transform={`rotate(${(directionalAngle * 180) / Math.PI})`}
                    />
                  </svg>
                </div>
                <div className="text-[9px] mt-1" style={{ color: '#6666aa' }}>
                  扇形角度 {Math.round((DIRECTIONAL_ANGLE * 180) / Math.PI)}° · 半径{' '}
                  {calculateExplosionRadius('directional') / 30}格
                </div>
              </div>
            )}

            {isClicked && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: `${getBombColor(type)}40`,
                  animation: 'flash 0.15s ease-out',
                }}
              />
            )}
          </div>
        );
      })}

      {!isMyTurn && (
        <div
          className="text-center text-xs mt-2 p-2 rounded"
          style={{ color: '#ff6b6b', background: '#ff6b6b10', border: '1px solid #ff6b6b30' }}
        >
          ⚠ 等待其他玩家...
        </div>
      )}

      <style>{`
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Toolbar;
