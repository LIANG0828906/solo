import React from 'react';
import { useParticleStore, type FireworkType } from '../store/particleStore';

const COLORS = [
  '#FF5252',
  '#FF4081',
  '#E040FB',
  '#7C4DFF',
  '#536DFE',
  '#448AFF',
  '#40C4FF',
  '#18FFFF',
  '#64FFDA',
  '#69F0AE',
  '#B2FF59',
  '#EEFF41'
];

interface ControlPanelProps {
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onReset }) => {
  const {
    fireworkType,
    selectedColor,
    radius,
    speed,
    setFireworkType,
    setSelectedColor,
    setRadius,
    setSpeed
  } = useParticleStore();

  return (
    <div
      style={{
        width: '15%',
        minWidth: '200px',
        background: '#1E1E1E',
        borderRadius: '8px',
        margin: '0 8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: '#fff',
        height: 'calc(100% - 16px)',
        overflowY: 'auto',
        marginTop: '8px',
        marginBottom: '8px'
      }}
    >
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>控制面板</h2>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            color: '#aaa',
            marginBottom: '8px'
          }}
        >
          烟花种类
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['circle', 'spiral'] as FireworkType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFireworkType(type)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: fireworkType === type ? '2px solid #FF7043' : '2px solid #333',
                background: fireworkType === type ? '#FF704320' : '#2a2a2a',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease-out'
              }}
            >
              {type === 'circle' ? '●' : '⟐'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: '#888' }}>圆形</span>
          <span style={{ fontSize: '11px', color: '#888' }}>螺旋</span>
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            color: '#aaa',
            marginBottom: '8px'
          }}
        >
          爆炸颜色
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}
        >
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: color,
                border: selectedColor === color ? '3px solid #fff' : '3px solid transparent',
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.2s ease-out, border-color 0.2s ease-out',
                transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (selectedColor !== color) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedColor !== color) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#aaa',
            marginBottom: '8px'
          }}
        >
          <span>爆炸半径</span>
          <span style={{ color: '#FF7043' }}>{radius}px</span>
        </label>
        <input
          type="range"
          min={40}
          max={120}
          step={5}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{
            width: '100%',
            height: '25px',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            cursor: 'pointer'
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#aaa',
            marginBottom: '8px'
          }}
        >
          <span>粒子速度</span>
          <span style={{ color: '#FF7043' }}>{speed.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          step={0.5}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{
            width: '100%',
            height: '25px',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            cursor: 'pointer'
          }}
        />
      </div>

      <button
        onClick={onReset}
        style={{
          marginTop: 'auto',
          padding: '12px 16px',
          background: '#D32F2F',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.2s ease-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#C62828';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#D32F2F';
        }}
      >
        重置画布
      </button>

      <style>{`
        input[type="range"]::-webkit-slider-runnable-track {
          height: 6px;
          background: #333;
          border-radius: 3px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #FF7043;
          margin-top: -6px;
          cursor: pointer;
          transition: background 0.2s ease-out;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          background: #FF6D00;
        }
        input[type="range"]::-webkit-slider-thumb:active {
          background: #FF6D00;
        }
        input[type="range"]::-moz-range-track {
          height: 6px;
          background: #333;
          border-radius: 3px;
        }
        input[type="range"]::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #FF7043;
          border: none;
          cursor: pointer;
          transition: background 0.2s ease-out;
        }
        input[type="range"]::-moz-range-thumb:hover {
          background: #FF6D00;
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
