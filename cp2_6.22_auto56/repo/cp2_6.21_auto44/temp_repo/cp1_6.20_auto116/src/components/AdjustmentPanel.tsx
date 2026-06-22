import React, { memo, useMemo, useState, useCallback } from 'react';
import { Shuffle } from 'lucide-react';
import type { HSLColor } from '../types/color';
import { hslToHex } from '../utils/colorUtils';

interface AdjustmentPanelProps {
  baseColor: HSLColor;
  onBrightnessChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
  onRandom: () => void;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({
  baseColor,
  onBrightnessChange,
  onSaturationChange,
  onRandom,
}) => {
  const [brightnessInput, setBrightnessInput] = useState<string>(String(baseColor.l));
  const [saturationInput, setSaturationInput] = useState<string>(String(baseColor.s));

  const brightnessGradient = useMemo(() => {
    const startColor = hslToHex({ ...baseColor, l: 0 });
    const endColor = hslToHex({ ...baseColor, l: 100 });
    return `linear-gradient(to right, ${startColor}, ${endColor})`;
  }, [baseColor]);

  const saturationGradient = useMemo(() => {
    const startColor = hslToHex({ ...baseColor, s: 0 });
    const endColor = hslToHex({ ...baseColor, s: 100 });
    return `linear-gradient(to right, ${startColor}, ${endColor})`;
  }, [baseColor]);

  const handleBrightnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    onBrightnessChange(value);
    setBrightnessInput(String(value));
  }, [onBrightnessChange]);

  const handleSaturationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    onSaturationChange(value);
    setSaturationInput(String(value));
  }, [onSaturationChange]);

  const handleBrightnessInputBlur = useCallback(() => {
    const value = Math.max(0, Math.min(100, Number(brightnessInput) || 0));
    onBrightnessChange(value);
    setBrightnessInput(String(value));
  }, [brightnessInput, onBrightnessChange]);

  const handleSaturationInputBlur = useCallback(() => {
    const value = Math.max(0, Math.min(100, Number(saturationInput) || 0));
    onSaturationChange(value);
    setSaturationInput(String(value));
  }, [saturationInput, onSaturationChange]);

  const handleRandomClick = useCallback(() => {
    onRandom();
  }, [onRandom]);

  const sliderTrackStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: '#0f3460',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: '60px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #0f3460',
    background: '#1a1a2e',
    color: '#eaeaea',
    fontSize: '14px',
    textAlign: 'center' as const,
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div
      style={{
        background: '#16213e',
        borderRadius: '8px',
        padding: '16px',
        transition: 'all 0.2s ease',
      }}
    >
      <h3
        style={{
          fontWeight: 'bold',
          color: '#eaeaea',
          fontSize: '18px',
          margin: '0 0 20px 0',
        }}
      >
        微调面板
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <label style={{ color: '#eaeaea', fontSize: '14px', fontWeight: 500 }}>
            亮度
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={brightnessInput}
            onChange={(e) => setBrightnessInput(e.target.value)}
            onBlur={handleBrightnessInputBlur}
            style={inputStyle}
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={baseColor.l}
          onChange={handleBrightnessChange}
          style={{
            ...sliderTrackStyle,
            marginBottom: '8px',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLInputElement).style.setProperty('--thumb-bg', '#ffd700');
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLInputElement).style.setProperty('--thumb-bg', '#eaeaea');
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            background: var(--thumb-bg, #eaeaea) !important;
          }
          input[type="range"]::-moz-range-thumb {
            background: var(--thumb-bg, #eaeaea) !important;
          }
          input[type="range"]:hover::-webkit-slider-thumb {
            background: #ffd700 !important;
          }
          input[type="range"]:hover::-moz-range-thumb {
            background: #ffd700 !important;
          }
          input[type="range"]:active::-webkit-slider-thumb {
            background: #ffd700 !important;
          }
          input[type="range"]:active::-moz-range-thumb {
            background: #ffd700 !important;
          }
        `}</style>
        <div
          style={{
            width: '100%',
            height: '12px',
            borderRadius: '6px',
            background: brightnessGradient,
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <label style={{ color: '#eaeaea', fontSize: '14px', fontWeight: 500 }}>
            饱和度
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={saturationInput}
            onChange={(e) => setSaturationInput(e.target.value)}
            onBlur={handleSaturationInputBlur}
            style={inputStyle}
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={baseColor.s}
          onChange={handleSaturationChange}
          style={{
            ...sliderTrackStyle,
            marginBottom: '8px',
          }}
        />
        <div
          style={{
            width: '100%',
            height: '12px',
            borderRadius: '6px',
            background: saturationGradient,
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        />
      </div>

      <button
        onClick={handleRandomClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 20px',
          background: '#0f3460',
          color: '#eaeaea',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.2s ease, transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1a5276';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#0f3460';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <Shuffle size={18} />
        随机探索
      </button>
    </div>
  );
};

export default memo(AdjustmentPanel);
