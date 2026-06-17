import React, { useState, useCallback } from 'react';
import { Galaxy } from './GalaxyState';

interface UIPanelProps {
  galaxyA: Galaxy;
  galaxyB: Galaxy;
  onGalaxyAChange: (updates: Partial<Galaxy>) => void;
  onGalaxyBChange: (updates: Partial<Galaxy>) => void;
  onReset: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

interface GalaxyControlProps {
  galaxy: Galaxy;
  label: string;
  color: string;
  onStarCountChange: (value: number) => void;
  onArmDensityChange: (value: number) => void;
  onVelocityChange: (vx: number, vy: number) => void;
}

const GalaxyControl: React.FC<GalaxyControlProps> = ({
  galaxy,
  label,
  color,
  onStarCountChange,
  onArmDensityChange,
  onVelocityChange
}) => {
  const [isDraggingArrow, setIsDraggingArrow] = useState<'x' | 'y' | null>(null);

  const handleMouseDown = (axis: 'x' | 'y') => {
    setIsDraggingArrow(axis);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingArrow) return;

      if (isDraggingArrow === 'x') {
        const newVx = Math.max(-5, Math.min(5, galaxy.vx + e.movementX * 0.05));
        onVelocityChange(newVx, galaxy.vy);
      } else {
        const newVy = Math.max(-5, Math.min(5, galaxy.vy + e.movementY * 0.05));
        onVelocityChange(galaxy.vx, newVy);
      }
    },
    [isDraggingArrow, galaxy.vx, galaxy.vy, onVelocityChange]
  );

  const handleMouseUp = () => {
    setIsDraggingArrow(null);
  };

  return (
    <div
      className="galaxy-control"
      style={{
        width: '240px',
        backgroundColor: 'rgba(13, 17, 23, 0.9)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        border: `1px solid ${color}33`,
        transition: 'all 0.3s ease'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: color,
            marginRight: '10px',
            boxShadow: `0 0 10px ${color}`
          }}
        />
        <span style={{ color: '#E0E0E0', fontWeight: 600, fontSize: '14px' }}>
          {label}
        </span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ color: '#A0A0A0', fontSize: '12px' }}>恒星数量</label>
          <span style={{ color: color, fontSize: '12px', fontWeight: 500 }}>
            {galaxy.starCount}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="500"
          step="10"
          value={galaxy.starCount}
          onChange={e => onStarCountChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            appearance: 'none',
            background: `linear-gradient(to right, ${color} 0%, ${color} ${((galaxy.starCount - 50) / 450) * 100}%, #333 ${((galaxy.starCount - 50) / 450) * 100}%, #333 100%)`,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ color: '#A0A0A0', fontSize: '12px' }}>旋臂密度</label>
          <span style={{ color: color, fontSize: '12px', fontWeight: 500 }}>
            {galaxy.armDensity.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={galaxy.armDensity}
          onChange={e => onArmDensityChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            appearance: 'none',
            background: `linear-gradient(to right, ${color} 0%, ${color} ${((galaxy.armDensity - 0.5) / 1.5) * 100}%, #333 ${((galaxy.armDensity - 0.5) / 1.5) * 100}%, #333 100%)`,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        />
      </div>

      <div>
        <label style={{ color: '#A0A0A0', fontSize: '12px', display: 'block', marginBottom: '10px' }}>
          初始速度
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            className="velocity-arrow"
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '6px',
              cursor: 'grab',
              userSelect: 'none',
              transition: 'all 0.3s ease',
              border: '1px solid transparent'
            }}
            onMouseDown={() => handleMouseDown('x')}
          >
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>X 方向</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#E0E0E0', fontSize: '14px', fontWeight: 500 }}>
                {galaxy.vx.toFixed(2)}
              </span>
              <span style={{ color, fontSize: '16px' }}>↔</span>
            </div>
          </div>
          <div
            className="velocity-arrow"
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '6px',
              cursor: 'grab',
              userSelect: 'none',
              transition: 'all 0.3s ease',
              border: '1px solid transparent'
            }}
            onMouseDown={() => handleMouseDown('y')}
          >
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Y 方向</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#E0E0E0', fontSize: '14px', fontWeight: 500 }}>
                {galaxy.vy.toFixed(2)}
              </span>
              <span style={{ color, fontSize: '16px' }}>↕</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .galaxy-control:hover {
          box-shadow: 0 0 20px ${color}22;
          transform: translateY(-2px);
        }
        .velocity-arrow:hover {
          background-color: rgba(255,255,255,0.1) !important;
          border-color: ${color}44 !important;
        }
        .velocity-arrow:active {
          cursor: grabbing;
          transform: scale(0.98);
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${color};
          cursor: pointer;
          box-shadow: 0 0 8px ${color}88;
          transition: all 0.3s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 12px ${color};
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${color};
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px ${color}88;
        }
      `}</style>
    </div>
  );
};

const UIPanel: React.FC<UIPanelProps> = ({
  galaxyA,
  galaxyB,
  onGalaxyAChange,
  onGalaxyBChange,
  onReset,
  isPaused,
  onTogglePause
}) => {
  const handleStarCountChangeA = (value: number) => {
    onGalaxyAChange({ starCount: value });
  };

  const handleArmDensityChangeA = (value: number) => {
    onGalaxyAChange({ armDensity: value });
  };

  const handleVelocityChangeA = (vx: number, vy: number) => {
    onGalaxyAChange({ vx, vy });
  };

  const handleStarCountChangeB = (value: number) => {
    onGalaxyBChange({ starCount: value });
  };

  const handleArmDensityChangeB = (value: number) => {
    onGalaxyBChange({ armDensity: value });
  };

  const handleVelocityChangeB = (vx: number, vy: number) => {
    onGalaxyBChange({ vx, vy });
  };

  return (
    <div
      className="ui-panel"
      style={{
        width: '280px',
        padding: '16px',
        backgroundColor: '#0D1117',
        borderRight: '1px solid #21262D',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#E0E0E0', fontSize: '18px', margin: 0, marginBottom: '4px' }}>
          星系碰撞模拟器
        </h1>
        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
          拖拽星系观察引力交互
        </p>
      </div>

      <GalaxyControl
        galaxy={galaxyA}
        label="星系 A"
        color="#64B5F6"
        onStarCountChange={handleStarCountChangeA}
        onArmDensityChange={handleArmDensityChangeA}
        onVelocityChange={handleVelocityChangeA}
      />

      <GalaxyControl
        galaxy={galaxyB}
        label="星系 B"
        color="#F06292"
        onStarCountChange={handleStarCountChangeB}
        onArmDensityChange={handleArmDensityChangeB}
        onVelocityChange={handleVelocityChangeB}
      />

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          gap: '10px',
          paddingTop: '16px',
          borderTop: '1px solid #21262D'
        }}
      >
        <button
          onClick={onTogglePause}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: isPaused ? '#00ACC1' : '#FF6F00',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease-out'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = `0 0 15px ${isPaused ? '#00ACC1' : '#FF6F00'}66`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isPaused ? '▶ 继续' : '⏸ 暂停'}
        </button>
        <button
          onClick={onReset}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: '#1F2833',
            color: '#E0E0E0',
            border: '1px solid #333',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease-out'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = '#2A3440';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#1F2833';
          }}
        >
          ↻ 重置
        </button>
      </div>
    </div>
  );
};

export default UIPanel;
