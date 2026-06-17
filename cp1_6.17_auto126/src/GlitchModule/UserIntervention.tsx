import React, { useState } from 'react';
import useAppStore from '../AppStore';
import { glitchEngine } from './GlitchEngine';

const UserIntervention: React.FC = () => {
  const { health, glitchCount, repairCount, frequency, setFrequency } = useAppStore();
  const [isButtonFlashing, setIsButtonFlashing] = useState(false);
  const [sliderValue, setSliderValue] = useState(frequency);

  const handleRepairClick = () => {
    setIsButtonFlashing(true);
    setTimeout(() => setIsButtonFlashing(false), 100);
    glitchEngine.triggerRepair();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setSliderValue(value);
    setFrequency(value);
  };

  const healthColor = (() => {
    const ratio = health / 100;
    const r = Math.floor(255 * (1 - ratio) + 68 * ratio);
    const g = Math.floor(68 * (1 - ratio) + 255 * ratio);
    const b = 68;
    return `rgb(${r}, ${g}, ${b})`;
  })();

  const progressGradient = `linear-gradient(to right, #FF4444 0%, #FFFF44 50%, #44FF44 100%)`;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '8px',
      minWidth: '250px',
      fontFamily: 'Consolas, Monaco, monospace',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: '#CCCCCC', fontSize: '14px' }}>健康度</span>
          <span style={{ color: healthColor, fontSize: '18px', fontWeight: 'bold' }}>
            {health}%
          </span>
        </div>
        <div style={{
          width: '200px',
          height: '12px',
          backgroundColor: '#333',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: progressGradient,
            opacity: 0.3,
            position: 'absolute',
          }} />
          <div style={{
            width: `${health}%`,
            height: '100%',
            background: progressGradient,
            transition: 'width 0.3s ease',
            position: 'relative',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: '#CCCCCC',
          fontSize: '14px',
        }}>
          <span>故障次数</span>
          <span style={{ color: '#FF6666' }}>{glitchCount}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: '#CCCCCC',
          fontSize: '14px',
        }}>
          <span>修复次数</span>
          <span style={{ color: '#66FF66' }}>{repairCount}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: '#CCCCCC', fontSize: '14px' }}>故障频率</span>
          <span style={{
            color: '#00FF88',
            fontSize: '14px',
            fontWeight: 'bold',
            transform: 'translateY(-10px)',
            transition: 'transform 0.1s',
          }}>
            {sliderValue}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderChange}
          style={{
            width: '200px',
            height: '6px',
            backgroundColor: '#333',
            borderRadius: '3px',
            outline: 'none',
            appearance: 'none',
            cursor: 'pointer',
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: #00FF88;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #00FF88;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
          }
        `}</style>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: '#666',
          fontSize: '11px',
        }}>
          <span>低</span>
          <span>高</span>
        </div>
      </div>

      <button
        onClick={handleRepairClick}
        style={{
          padding: '12px 20px',
          backgroundColor: isButtonFlashing ? 'rgba(255, 255, 255, 0.5)' : '#00B4D8',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          fontFamily: 'Consolas, Monaco, monospace',
          boxShadow: '0 0 15px rgba(0, 180, 216, 0.4)',
        }}
        onMouseEnter={(e) => {
          if (!isButtonFlashing) {
            e.currentTarget.style.backgroundColor = '#0096C7';
          }
        }}
        onMouseLeave={(e) => {
          if (!isButtonFlashing) {
            e.currentTarget.style.backgroundColor = '#00B4D8';
          }
        }}
      >
        注入修复数据
      </button>

      <div style={{
        marginTop: '10px',
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#888',
        lineHeight: '1.5',
      }}>
        <div>💡 提示：</div>
        <div>• 拖拽植物或生物可移动位置</div>
        <div>• 点击按钮注入修复数据</div>
        <div>• 调节滑块改变故障频率</div>
      </div>
    </div>
  );
};

export default UserIntervention;
