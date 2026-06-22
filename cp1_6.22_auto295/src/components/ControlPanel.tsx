import React from 'react';
import { getAllSchemeNames } from '../modules/SchemeManager';

interface ControlPanelProps {
  currentScheme: number;
  opacity: number;
  onSchemeChange: (index: number) => void;
  onOpacityChange: (value: number) => void;
  onResetView: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentScheme,
  opacity,
  onSchemeChange,
  onOpacityChange,
  onResetView,
}) => {
  const schemeNames = getAllSchemeNames();

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        top: 16,
        width: 240,
        background: 'linear-gradient(180deg, #2C2C3A 0%, #3A3A4A 100%)',
        borderRadius: 12,
        padding: 16,
        zIndex: 10,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <h2
        style={{
          margin: '0 0 16px 0',
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: 600,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        改造方案对比
      </h2>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            color: '#AAAAAA',
            fontSize: 12,
            marginBottom: 8,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          选择方案
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {schemeNames.map((name, index) => (
            <button
              key={index}
              onClick={() => onSchemeChange(index)}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#FFFFFF',
                background: currentScheme === index ? '#4A90D9' : '#4A4A5A',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (currentScheme !== index) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#55556A';
                }
              }}
              onMouseLeave={(e) => {
                if (currentScheme !== index) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#4A4A5A';
                }
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            color: '#AAAAAA',
            fontSize: 12,
            marginBottom: 8,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          建筑透明度: {opacity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.2}
          max={1.0}
          step={0.01}
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: 4,
            appearance: 'none',
            WebkitAppearance: 'none',
            background: '#1A1A2A',
            borderRadius: 2,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #4A90D9;
            cursor: pointer;
            border: none;
            transition: transform 0.2s ease;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #4A90D9;
            cursor: pointer;
            border: none;
          }
        `}</style>
      </div>

      <button
        onClick={onResetView}
        style={{
          width: '100%',
          height: 40,
          borderRadius: 8,
          border: '1px solid #55556A',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#FFFFFF',
          background: 'transparent',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#55556A';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#66667A';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#55556A';
        }}
      >
        复位视角
      </button>

      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid #4A4A5A',
        }}
      >
        <div
          style={{
            color: '#888899',
            fontSize: 11,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1.6,
          }}
        >
          <div>操作提示:</div>
          <div>• 鼠标拖拽旋转视角</div>
          <div>• 滚轮缩放 (0.5x)</div>
          <div>• WASD 平移视角</div>
          <div>• 双击地面复位</div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
