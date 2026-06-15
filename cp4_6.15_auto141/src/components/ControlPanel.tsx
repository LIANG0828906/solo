import React, { useState, useRef, useEffect } from 'react';
import type { LayoutParams } from '../modules/LayoutEngine';

interface ControlPanelProps {
  params: LayoutParams;
  onChange: (params: Partial<LayoutParams>) => void;
  isMobile: boolean;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipX, setTooltipX] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const updateTooltipPosition = (_clientX: number) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = (value - min) / (max - min);
      setTooltipX(percentage * rect.width);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setShowTooltip(true);
    updateTooltipPosition(e.clientX);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateTooltipPosition(moveEvent.clientX);
    };
    
    const handleMouseUp = () => {
      setTimeout(() => setShowTooltip(false), 300);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{
      marginBottom: 16
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          color: '#4a6fa5',
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>{label}</span>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#1e3a5f'
        }}>{value}{unit}</span>
      </div>
      
      <div
        ref={sliderRef}
        style={{
          position: 'relative',
          height: 6
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: '#e8edf3',
          borderRadius: 3
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${percentage}%`,
          height: 6,
          backgroundColor: '#4a6fa5',
          borderRadius: 3,
          transition: 'width 0.05s linear'
        }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => {
            setShowTooltip(true);
            updateTooltipPosition(e.touches[0].clientX);
          }}
          onTouchEnd={() => setTimeout(() => setShowTooltip(false), 300)}
          style={{
            position: 'absolute',
            top: -6,
            left: 0,
            width: '100%',
            height: 18,
            opacity: 0,
            cursor: 'pointer',
            margin: 0
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: `calc(${percentage}% - 10px)`,
            width: 20,
            height: 20,
            backgroundColor: 'white',
            border: `2px solid #4a6fa5`,
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            transition: 'left 0.05s linear'
          }}
        />
        
        {showTooltip && (
          <div
            style={{
              position: 'absolute',
              top: -32,
              left: tooltipX - 20,
              transform: 'translateX(-50%)',
              padding: '4px 8px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 4,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              animation: 'fadeIn 0.15s ease-out',
              zIndex: 100
            }}
          >
            {value}{unit}
            <div style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              backgroundColor: '#1e3a5f'
            }} />
          </div>
        )}
      </div>
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({ params, onChange, isMobile }) => {
  const [colorInput, setColorInput] = useState(params.color);

  useEffect(() => {
    setColorInput(params.color);
  }, [params.color]);

  const handleColorChange = (color: string) => {
    setColorInput(color);
    onChange({ color });
  };

  const panelStyle: React.CSSProperties = isMobile ? {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid #d1d9e6',
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
    borderRadius: '12px 12px 0 0',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    overflowX: 'auto'
  } : {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 240,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    zIndex: 30
  };

  if (isMobile) {
    return (
      <div style={panelStyle}>
        <div style={{ flex: '0 0 180px' }}>
          <Slider
            label="字号"
            value={params.fontSize}
            min={12}
            max={120}
            step={1}
            unit="px"
            onChange={(v) => onChange({ fontSize: v })}
          />
        </div>
        <div style={{ flex: '0 0 180px' }}>
          <Slider
            label="行高"
            value={params.lineHeight}
            min={1.0}
            max={2.0}
            step={0.1}
            unit=""
            onChange={(v) => onChange({ lineHeight: v })}
          />
        </div>
        <div style={{ flex: '0 0 180px' }}>
          <Slider
            label="字间距"
            value={params.letterSpacing}
            min={-0.05}
            max={0.3}
            step={0.01}
            unit="em"
            onChange={(v) => onChange({ letterSpacing: v })}
          />
        </div>
        <div style={{
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#4a6fa5',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>颜色</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={colorInput}
              onChange={(e) => handleColorChange(e.target.value)}
              style={{
                width: 32,
                height: 32,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                padding: 0
              }}
            />
            <input
              type="text"
              value={colorInput}
              onChange={(e) => handleColorChange(e.target.value)}
              style={{
                width: 80,
                padding: '6px 8px',
                fontSize: 12,
                border: '1px solid #d1d9e6',
                borderRadius: 6,
                textTransform: 'uppercase'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle} className="fade-in">
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#1e3a5f',
        marginBottom: 16
      }}>
        排版控制
      </div>

      <Slider
        label="字号"
        value={params.fontSize}
        min={12}
        max={120}
        step={1}
        unit="px"
        onChange={(v) => onChange({ fontSize: v })}
      />

      <Slider
        label="行高"
        value={params.lineHeight}
        min={1.0}
        max={2.0}
        step={0.1}
        unit=""
        onChange={(v) => onChange({ lineHeight: v })}
      />

      <Slider
        label="字间距"
        value={params.letterSpacing}
        min={-0.05}
        max={0.3}
        step={0.01}
        unit="em"
        onChange={(v) => onChange({ letterSpacing: v })}
      />

      <div style={{
        marginBottom: 16
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#4a6fa5',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>文本颜色</span>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#1e3a5f',
            textTransform: 'uppercase'
          }}>{colorInput}</span>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="color"
            value={colorInput}
            onChange={(e) => handleColorChange(e.target.value)}
            style={{
              width: 40,
              height: 40,
              border: '1px solid #d1d9e6',
              borderRadius: 6,
              cursor: 'pointer',
              padding: 0
            }}
          />
          <input
            type="text"
            value={colorInput}
            onChange={(e) => handleColorChange(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #d1d9e6',
              borderRadius: 6,
              textTransform: 'uppercase'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
