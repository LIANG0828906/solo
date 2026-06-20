import React, { useState, useRef, useEffect } from 'react';
import type { LightState, LightParams } from '../types';
import { kelvinToRgb } from '../utils/lightUtils';

interface LightControlPanelProps {
  lightId: string;
  position: { x: number; y: number };
  lights: LightState;
  setLightParams: (id: string, params: Partial<LightParams>) => void;
  onClose: () => void;
}

const LightControlPanel: React.FC<LightControlPanelProps> = ({ lightId, position, lights, setLightParams, onClose }) => {
  const params = lights[lightId];
  const panelRef = useRef<HTMLDivElement>(null);
  const [draggingAngle, setDraggingAngle] = useState(false);
  const [tempAngle, setTempAngle] = useState<number | null>(null);

  useEffect(() => {
    if (tempAngle === null) return;
    setLightParams(lightId, { angle: tempAngle });
  }, [tempAngle, lightId, setLightParams]);

  if (!params) return null;

  const currentAngle = tempAngle !== null ? tempAngle : params.angle;

  const createColorTempGradient = () => {
    const stops: string[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const kelvin = 2700 + t * (6500 - 2700);
      const color = kelvinToRgb(kelvin);
      stops.push(`rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)}) ${(t * 100).toFixed(0)}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 260,
    padding: '18px 20px',
    background: 'rgba(0,0,0,0.06)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 8,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: '1px solid rgba(255,255,255,0.5)',
    zIndex: 200,
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#333',
    marginBottom: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const ringContainerStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x - 45,
    top: position.y - 45,
    width: 90,
    height: 90,
    pointerEvents: 'none',
    zIndex: 150,
  };

  const ringRadius = 40;

  const handleRingMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingAngle(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    updateAngleFromMouse(e.clientX, e.clientY, rect);
  };

  const handleRingMouseMove = (e: React.MouseEvent) => {
    if (!draggingAngle) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    updateAngleFromMouse(e.clientX, e.clientY, rect);
  };

  const updateAngleFromMouse = (clientX: number, clientY: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = Math.atan2(dy, dx) * 180 / Math.PI;
    deg = (deg + 360) % 360;
    deg = Math.round(deg);
    setTempAngle(deg);
  };

  const knobAngleX = Math.cos((currentAngle * Math.PI) / 180) * ringRadius + 45;
  const knobAngleY = Math.sin((currentAngle * Math.PI) / 180) * ringRadius + 45;

  return (
    <>
      <div
        style={ringContainerStyle}
        onMouseDown={handleRingMouseDown}
        onMouseMove={handleRingMouseMove}
        onMouseUp={() => setDraggingAngle(false)}
        onMouseLeave={() => setDraggingAngle(false)}
      >
        <svg width="90" height="90" style={{ pointerEvents: 'auto', cursor: 'grab' }}>
          <circle
            cx="45"
            cy="45"
            r={ringRadius}
            fill="none"
            stroke="rgba(255, 228, 160, 0.4)"
            strokeWidth="8"
          />
          <path
            d={`M 45 45 L ${45 + Math.cos((currentAngle * Math.PI) / 180) * ringRadius} ${45 + Math.sin((currentAngle * Math.PI) / 180) * ringRadius}`}
            stroke="#FFAA00"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx={knobAngleX}
            cy={knobAngleY}
            r="7"
            fill="#FFAA00"
            stroke="#FFFFFF"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: -28,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          fontWeight: 600,
          color: '#FFAA00',
          background: 'rgba(255,255,255,0.9)',
          padding: '3px 8px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}>
          {currentAngle}°
        </div>
      </div>

      <div ref={panelRef} style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#222' }}>灯具控制</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#888',
              width: 24,
              height: 24,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={labelStyle}>
            <span>开关</span>
            <button
              onClick={() => setLightParams(lightId, { on: !params.on })}
              style={{
                width: 42,
                height: 22,
                borderRadius: 11,
                border: 'none',
                cursor: 'pointer',
                background: params.on ? '#9DBEB6' : '#CCC',
                position: 'relative',
                transition: 'background 0.2s ease',
                padding: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 2,
                left: params.on ? 22 : 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transition: 'left 0.2s ease',
              }} />
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={labelStyle}>
            <span>💡 亮度</span>
            <span style={{ color: '#666', fontWeight: 500 }}>{Math.round(params.brightness * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={params.brightness * 100}
            onChange={(e) => setLightParams(lightId, { brightness: Number(e.target.value) / 100 })}
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              background: `linear-gradient(to right, #9DBEB6 0%, #9DBEB6 ${params.brightness * 100}%, #E0E0E0 ${params.brightness * 100}%, #E0E0E0 100%)`,
              appearance: 'none',
              WebkitAppearance: 'none',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={labelStyle}>
            <span>🌡 色温</span>
            <span style={{ color: '#666', fontWeight: 500 }}>{params.colorTemp}K</span>
          </div>
          <div style={{
            position: 'relative',
            height: 8,
            borderRadius: 4,
            background: createColorTempGradient(),
            marginBottom: 8,
          }}>
            <div
              style={{
                position: 'absolute',
                top: -2,
                left: `calc(${((params.colorTemp - 2700) / (6500 - 2700)) * 100}% - 6px)`,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#fff',
                border: '2px solid #666',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
              }}
            />
          </div>
          <input
            type="range"
            min="2700"
            max="6500"
            step="50"
            value={params.colorTemp}
            onChange={(e) => setLightParams(lightId, { colorTemp: Number(e.target.value) })}
            style={{
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              background: 'transparent',
              outline: 'none',
              cursor: 'pointer',
              margin: 0,
            }}
          />
        </div>

        <div>
          <div style={labelStyle}>
            <span>🧭 光束角度</span>
            <span style={{ color: '#666', fontWeight: 500 }}>{currentAngle}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={currentAngle}
            onChange={(e) => {
              setTempAngle(null);
              setLightParams(lightId, { angle: Number(e.target.value) });
            }}
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              background: `linear-gradient(to right, #FFAA00 0%, #FFAA00 ${(currentAngle / 360) * 100}%, #E0E0E0 ${(currentAngle / 360) * 100}%, #E0E0E0 100%)`,
              appearance: 'none',
              WebkitAppearance: 'none',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>
    </>
  );
};

const addSliderThumbStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 2px solid #999;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      margin-top: -5px;
    }
    input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 2px solid #999;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    input[type="range"]::-webkit-slider-runnable-track {
      height: 6px;
      border-radius: 3px;
    }
    input[type="range"]::-moz-range-track {
      height: 6px;
      border-radius: 3px;
    }
  `;
  document.head.appendChild(style);
};

if (typeof window !== 'undefined') {
  setTimeout(addSliderThumbStyles, 0);
}

export default LightControlPanel;
