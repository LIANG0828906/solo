import React, { useState, useCallback } from 'react';
import type { SceneConfig } from '../types';

interface ControlPanelProps {
  initialConfig: SceneConfig;
  onConfigChange: (config: Partial<SceneConfig>) => void;
  onReset: () => void;
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  right: 20,
  bottom: 20,
  width: 220,
  height: 'auto',
  padding: '18px 16px',
  background: 'rgba(20, 22, 48, 0.55)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(139, 92, 246, 0.25)',
  borderRadius: 12,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(139, 92, 246, 0.08)',
  color: '#E2E8F0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  userSelect: 'none',
  zIndex: 10,
};

const titleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 14,
  letterSpacing: 0.5,
  color: '#F1F5F9',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const titleDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  boxShadow: '0 0 8px #8B5CF6',
};

const sliderGroupStyle: React.CSSProperties = {
  marginBottom: 14,
};

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,
};

const labelTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#CBD5E1',
  fontWeight: 500,
};

const valueTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#A78BFA',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  minWidth: 40,
  textAlign: 'right',
};

const sliderContainerStyle: React.CSSProperties = {
  position: 'relative',
  height: 4,
  background: '#334155',
  borderRadius: 4,
  cursor: 'pointer',
};

const sliderTrackStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  background: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
  borderRadius: 4,
  pointerEvents: 'none',
  boxShadow: '0 0 6px rgba(139, 92, 246, 0.5)',
};

const sliderThumbStyle = (active: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: '50%',
  width: 16,
  height: 16,
  borderRadius: '50%',
  background: active ? '#A78BFA' : '#8B5CF6',
  border: '2px solid #fff',
  transform: 'translate(-50%, -50%) scale(1)',
  cursor: 'grab',
  boxShadow: active
    ? '0 0 12px rgba(139, 92, 246, 0.9), 0 2px 8px rgba(0,0,0,0.4)'
    : '0 0 8px rgba(139, 92, 246, 0.6), 0 2px 6px rgba(0,0,0,0.3)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  zIndex: 2,
});

const resetButtonContainerStyle: React.CSSProperties = {
  position: 'relative',
  marginTop: 16,
  overflow: 'hidden',
  borderRadius: 8,
};

const resetButtonBaseStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  border: 'none',
  borderRadius: 8,
  background: '#EF4444',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: 0.5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'transform 0.1s ease, background 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
};

const flashOverlayStyle = (visible: boolean): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(circle at center, rgba(255,200,200,0.8) 0%, rgba(239,68,68,0.3) 60%, transparent 100%)',
  opacity: visible ? 1 : 0,
  pointerEvents: 'none',
  transition: 'opacity 0.3s ease',
  borderRadius: 8,
});

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, formatValue, onChange }) => {
  const [dragging, setDragging] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const pct = ((value - min) / (max - min)) * 100;

  const computeValue = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return value;
      const rect = containerRef.current.getBoundingClientRect();
      let ratio = (clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      return Math.max(min, Math.min(max, stepped));
    },
    [min, max, step, value]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      const v = computeValue(e.clientX);
      onChange(v);

      const handleMove = (ev: MouseEvent) => {
        const v2 = computeValue(ev.clientX);
        onChange(v2);
      };
      const handleUp = () => {
        setDragging(false);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [computeValue, onChange]
  );

  return (
    <div style={sliderGroupStyle}>
      <div style={labelRowStyle}>
        <span style={labelTextStyle}>{label}</span>
        <span style={valueTextStyle}>{formatValue ? formatValue(value) : value.toFixed(2)}</span>
      </div>
      <div
        ref={containerRef}
        style={sliderContainerStyle}
        onMouseDown={handleMouseDown}
      >
        <div style={{ ...sliderTrackStyle, width: `${pct}%` }} />
        <div
          style={{
            ...sliderThumbStyle(dragging),
            left: `${pct}%`,
            transform: `translate(-50%, -50%) scale(${dragging ? 1.15 : 1})`,
          }}
        />
      </div>
    </div>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({ initialConfig, onConfigChange, onReset }) => {
  const [glowIntensity, setGlowIntensity] = useState(initialConfig.glowIntensity);
  const [rotationSpeed, setRotationSpeed] = useState(initialConfig.rotationSpeed);
  const [subPointAmplitude, setSubPointAmplitude] = useState(initialConfig.subPointAmplitude);
  const [resetPressed, setResetPressed] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);

  const handleGlowChange = useCallback(
    (v: number) => {
      setGlowIntensity(v);
      onConfigChange({ glowIntensity: v });
    },
    [onConfigChange]
  );

  const handleRotationChange = useCallback(
    (v: number) => {
      setRotationSpeed(v);
      onConfigChange({ rotationSpeed: v });
    },
    [onConfigChange]
  );

  const handleAmplitudeChange = useCallback(
    (v: number) => {
      setSubPointAmplitude(v);
      onConfigChange({ subPointAmplitude: v });
    },
    [onConfigChange]
  );

  const handleResetMouseDown = () => {
    setResetPressed(true);
  };

  const handleResetMouseUp = () => {
    setResetPressed(false);
  };

  const handleResetClick = () => {
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 300);
    onReset();
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>
        <span style={titleDotStyle} />
        <span>星轨织造者</span>
      </div>

      <Slider
        label="光晕亮度"
        value={glowIntensity}
        min={0.0}
        max={1.0}
        step={0.01}
        onChange={handleGlowChange}
      />
      <Slider
        label="旋转速度"
        value={rotationSpeed}
        min={0}
        max={0.02}
        step={0.001}
        formatValue={(v) => `${(v * 1000).toFixed(0)}e-3`}
        onChange={handleRotationChange}
      />
      <Slider
        label="子光点振幅"
        value={subPointAmplitude}
        min={0.1}
        max={0.8}
        step={0.01}
        onChange={handleAmplitudeChange}
      />

      <div style={resetButtonContainerStyle}>
        <button
          style={{
            ...resetButtonBaseStyle,
            transform: `scale(${resetPressed ? 0.95 : 1})`,
            background: resetPressed ? '#DC2626' : '#EF4444',
          }}
          onMouseDown={handleResetMouseDown}
          onMouseUp={handleResetMouseUp}
          onMouseLeave={handleResetMouseUp}
          onClick={handleResetClick}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          重置场景
        </button>
        <div style={flashOverlayStyle(flashVisible)} />
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
        <div style={{ fontSize: 10.5, color: '#94A3B8', lineHeight: 1.7 }}>
          <div style={{ color: '#A78BFA', fontWeight: 600, marginBottom: 4 }}>操作提示</div>
          <div>• 拖拽光点：调整位置</div>
          <div>• Shift+点击：连接两点</div>
          <div>• 鼠标滚轮：缩放视角</div>
        </div>
      </div>
    </div>
  );
};
