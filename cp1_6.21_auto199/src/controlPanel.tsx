import { useState, useEffect } from 'react';
import { TreeParams } from './treeModel';

interface ControlPanelProps {
  params: TreeParams;
  onChange: (params: TreeParams) => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            color: '#94A3B8',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '14px',
            color: '#94A3B8',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '6px',
            backgroundColor: '#374151',
            borderRadius: '3px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            height: '6px',
            backgroundColor: '#6366F1',
            borderRadius: '3px',
            width: `${((value - min) / (max - min)) * 100}%`,
            transition: 'width 0.2s ease-out',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            height: '24px',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
            padding: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${((value - min) / (max - min)) * 100}% - 10px)`,
            width: '20px',
            height: '20px',
            backgroundColor: '#6366F1',
            borderRadius: '50%',
            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.15s ease-out, background-color 0.2s ease-out, left 0.1s linear',
            pointerEvents: 'none',
            transform: 'scale(1)',
          }}
          className="custom-slider-thumb"
        />
      </div>
    </div>
  );
}

export default function ControlPanel({ params, onChange }: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleChange = (key: keyof TreeParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: '#1E293B',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        padding: isExpanded ? '20px' : '12px 20px',
        zIndex: 100,
        transition: 'all 0.3s ease-out',
        height: isExpanded ? 'auto' : '80px',
        maxHeight: isExpanded ? '70vh' : '80px',
        overflowY: isExpanded ? 'auto' : 'hidden',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
      }
    : {
        width: '300px',
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        padding: '20px',
        margin: '20px',
        transition: 'all 0.3s ease-out',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      };

  return (
    <div style={panelStyle}>
      <div
        onClick={() => isMobile && setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isExpanded ? '20px' : '0',
          cursor: isMobile ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#F1F5F9',
            margin: 0,
          }}
        >
          🌳 魔法树控制面板
        </h2>
        {isMobile && (
          <span
            style={{
              color: '#94A3B8',
              fontSize: '20px',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease-out',
            }}
          >
            ▼
          </span>
        )}
      </div>

      {isExpanded && (
        <div>
          <Slider
            label="☀️ 光照强度"
            value={params.lightIntensity}
            min={0}
            max={2.0}
            step={0.01}
            onChange={(v) => handleChange('lightIntensity', v)}
          />
          <Slider
            label="💧 浇水量"
            value={params.waterAmount}
            min={0}
            max={1.0}
            step={0.01}
            onChange={(v) => handleChange('waterAmount', v)}
          />
          <Slider
            label="🌿 养分量"
            value={params.nutrientAmount}
            min={0}
            max={1.0}
            step={0.01}
            onChange={(v) => handleChange('nutrientAmount', v)}
          />
          <Slider
            label="⏱️ 生长速度"
            value={params.growthSpeed}
            min={0.5}
            max={3.0}
            step={0.1}
            unit="x"
            onChange={(v) => handleChange('growthSpeed', v)}
          />

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: '#94A3B8',
                marginBottom: '6px',
                lineHeight: 1.6,
              }}
            >
              💡 提示：调节光照、水分和养分可以加速树木生长。增加浇水量会触发蓝色水雾，增加养分量会触发金色星光粒子效果。
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-slider-thumb:hover {
          filter: brightness(1.1);
        }
        input[type="range"]:active + .custom-slider-thumb {
          transform: scale(0.95);
        }
        input[type="range"]:hover + .custom-slider-thumb {
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}
