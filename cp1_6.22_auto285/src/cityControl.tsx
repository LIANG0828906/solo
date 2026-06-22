import React, { useState, useCallback } from 'react';
import { CityParams } from './buildingGenerator';

interface SliderConfig {
  key: keyof CityParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SLIDER_CONFIGS: SliderConfig[] = [
  { key: 'density', label: '建筑密度', min: 10, max: 100, step: 1, unit: '%' },
  { key: 'maxHeight', label: '高度上限', min: 10, max: 200, step: 5, unit: 'm' },
  { key: 'greenCoverage', label: '绿化覆盖率', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'eraStyle', label: '时代风格', min: 0, max: 100, step: 1, unit: '' },
  { key: 'sunAngle', label: '日照角度', min: 0, max: 360, step: 1, unit: '°' },
];

const getEraLabel = (value: number): string => {
  if (value < 33) return '古典';
  if (value < 66) return '现代';
  return '未来';
};

export const useCityParams = () => {
  const [params, setParams] = useState<CityParams>({
    density: 50,
    maxHeight: 100,
    greenCoverage: 30,
    eraStyle: 50,
    sunAngle: 45,
  });

  const updateParam = useCallback((key: keyof CityParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  return { params, updateParam };
};

interface CityControlPanelProps {
  params: CityParams;
  onParamChange: (key: keyof CityParams, value: number) => void;
}

export const CityControlPanel: React.FC<CityControlPanelProps> = ({ params, onParamChange }) => {
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '24px',
    right: '24px',
    width: '280px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1A1A2E',
    margin: '0 0 16px 0',
  };

  const sliderContainerStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#4682B4',
    minWidth: '60px',
    textAlign: 'right',
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#E0E0E0',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer',
  };

  const getEraValueDisplay = (config: SliderConfig, value: number): string => {
    if (config.key === 'eraStyle') {
      return `${getEraLabel(value)}`;
    }
    return `${value}${config.unit}`;
  };

  return (
    <div style={panelStyle}>
      <h2 style={titleStyle}>城市参数控制</h2>
      {SLIDER_CONFIGS.map((config) => (
        <div key={config.key} style={sliderContainerStyle}>
          <div style={labelRowStyle}>
            <span style={labelStyle}>{config.label}</span>
            <span style={valueStyle}>
              {getEraValueDisplay(config, params[config.key])}
            </span>
          </div>
          <input
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={params[config.key]}
            onChange={(e) => onParamChange(config.key, Number(e.target.value))}
            style={sliderStyle}
            className="custom-slider"
          />
          {config.key === 'eraStyle' && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#888',
              marginTop: '4px',
            }}>
              <span>古典</span>
              <span>现代</span>
              <span>未来</span>
            </div>
          )}
        </div>
      ))}
      <style>{`
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4682B4;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.15s ease;
        }
        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .custom-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4682B4;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .custom-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, #4682B4 var(--progress, 50%), #E0E0E0 var(--progress, 50%));
        }
      `}</style>
    </div>
  );
};
