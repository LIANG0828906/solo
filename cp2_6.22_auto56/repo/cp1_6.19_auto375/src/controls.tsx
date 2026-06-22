import React from 'react';
import { useParticleStore } from './store';
import { playClickSound } from './utils';

const Controls: React.FC = () => {
  const {
    morphology,
    turbulence,
    colorTemp,
    fps,
    particleCount,
    setMorphology,
    setTurbulence,
    setColorTemp,
  } = useParticleStore();

  const handleSliderChange = (
    setter: (value: number) => void,
    value: number
  ) => {
    playClickSound();
    setter(value);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: '24px',
        bottom: '24px',
        padding: '20px',
        backgroundColor: 'rgba(31, 40, 51, 0.7)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        color: 'white',
        fontFamily: 'monospace, sans-serif',
        minWidth: '280px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: '#66FF66',
          marginBottom: '16px',
          letterSpacing: '0.5px',
        }}
      >
        {particleCount.toLocaleString()} particles | {fps} fps
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '11px',
            color: '#C5C6C7',
            marginBottom: '6px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>形态 Morphology</span>
          <span style={{ color: '#66FF66' }}>{morphology.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={morphology}
          onChange={(e) =>
            handleSliderChange(setMorphology, parseFloat(e.target.value))
          }
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background:
              'linear-gradient(to right, #00E5FF 0%, #B388FF 50%, #FF6B00 100%)',
            appearance: 'none',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            fontSize: '9px',
            color: '#66FF66',
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}
        >
          <span>球状</span>
          <span>螺旋</span>
          <span>环状</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '11px',
            color: '#C5C6C7',
            marginBottom: '6px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>湍流度 Turbulence</span>
          <span style={{ color: '#66FF66' }}>{turbulence.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.01"
          value={turbulence}
          onChange={(e) =>
            handleSliderChange(setTurbulence, parseFloat(e.target.value))
          }
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background:
              'linear-gradient(to right, #1F2833 0%, #45A29E 50%, #66FCF1 100%)',
            appearance: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            fontSize: '11px',
            color: '#C5C6C7',
            marginBottom: '6px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>色温偏移 Color Temp</span>
          <span style={{ color: '#66FF66' }}>{colorTemp.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={colorTemp}
          onChange={(e) =>
            handleSliderChange(setColorTemp, parseFloat(e.target.value))
          }
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background:
              'linear-gradient(to right, #0066FF 0%, #B388FF 50%, #FF6B00 100%)',
            appearance: 'none',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            fontSize: '9px',
            color: '#66FF66',
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}
        >
          <span>冷蓝</span>
          <span>中性</span>
          <span>暖橙</span>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(102, 255, 102, 0.5);
          border: 2px solid #66FF66;
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(102, 255, 102, 0.8);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(102, 255, 102, 0.5);
          border: 2px solid #66FF66;
        }
      `}</style>
    </div>
  );
};

export default Controls;
