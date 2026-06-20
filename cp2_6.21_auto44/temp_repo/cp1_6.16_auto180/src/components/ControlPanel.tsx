import React from 'react';
import { useStore } from '../store';
import { BUILDING_MODELS, LIGHT_MODE_PRESETS, LightMode } from '../types';
import { Sun, Cloud, Sunset, Lightbulb, Home, Building2, Museum } from 'lucide-react';

const panelStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(8px)',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '20px 18px',
  overflowY: 'auto',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#B0A8C0',
  marginBottom: '12px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const buttonBase: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#E0E0E0',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: "'system-ui', sans-serif",
};

const buttonActive: React.CSSProperties = {
  ...buttonBase,
  background: 'rgba(142, 45, 226, 0.35)',
  borderColor: 'rgba(142, 45, 226, 0.7)',
  boxShadow: '0 0 12px rgba(142, 45, 226, 0.4)',
};

const sliderWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '16px',
};

const sliderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '12px',
  color: '#C0B8D0',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  outline: 'none',
  appearance: 'none',
  background: 'linear-gradient(90deg, #4A00E0 0%, #8E2DE2 100%)',
  cursor: 'pointer',
};

function sliderThumbStyle(active: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'white',
    boxShadow: active
      ? '0 0 16px #8E2DE2, 0 0 24px rgba(142,45,226,0.6)'
      : '0 0 8px #8E2DE2',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
    pointerEvents: 'none',
  };
}

const LightModeIcons: Record<LightMode, React.ReactNode> = {
  sunny: <Sun size={15} />,
  cloudy: <Cloud size={15} />,
  dusk: <Sunset size={15} />,
  indoor: <Lightbulb size={15} />,
};

const LightModeLabels: Record<LightMode, string> = {
  sunny: '晴天',
  cloudy: '阴天',
  dusk: '黄昏',
  indoor: '室内日光灯',
};

const ModelIcons = {
  villa: <Home size={15} />,
  office: <Building2 size={15} />,
  museum: <Museum size={15} />,
};

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = React.useState(false);
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div style={sliderWrap}>
      <div style={sliderRow}>
        <span>{label}</span>
        <span style={{ color: '#8E2DE2', fontWeight: 600 }}>
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <div
        style={{ position: 'relative', height: '6px' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={sliderStyle}
        />
        <div
          style={{
            ...sliderThumbStyle(hover),
            left: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function ControlPanel() {
  const {
    currentModelId,
    lightConfig,
    setCurrentModel,
    setSunAzimuth,
    setSunElevation,
    setLightMode,
    setDraggingPoint,
    isDraggingPoint,
  } = useStore();

  const toggleDragging = () => {
    setDraggingPoint(!isDraggingPoint);
  };

  return (
    <div style={panelStyle}>
      <div>
        <div style={{ ...sectionTitleStyle, fontSize: '16px', color: '#E0E0E0', letterSpacing: '0' }}>
          建筑光照分析
        </div>
        <div style={{ fontSize: '12px', color: '#807890', marginTop: '4px' }}>
          交互式 3D 光影探索与采光评估
        </div>
      </div>

      <section>
        <div style={sectionTitleStyle}>建筑模型</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {BUILDING_MODELS.map((m) => {
            const active = m.id === currentModelId;
            return (
              <button
                key={m.id}
                style={active ? buttonActive : buttonBase}
                onClick={() => setCurrentModel(m.id)}
                title={m.name}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }}>
                  {ModelIcons[m.id]}
                  <span style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{m.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div style={sectionTitleStyle}>太阳位置</div>
        <Slider
          label="方位角"
          value={lightConfig.sunAzimuth}
          min={0}
          max={360}
          unit="°"
          onChange={setSunAzimuth}
        />
        <Slider
          label="高度角"
          value={lightConfig.sunElevation}
          min={0}
          max={90}
          unit="°"
          onChange={setSunElevation}
        />
      </section>

      <section>
        <div style={sectionTitleStyle}>环境光照模式</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {(Object.keys(LIGHT_MODE_PRESETS) as LightMode[]).map((mode) => {
            const active = mode === lightConfig.mode;
            return (
              <button
                key={mode}
                style={active ? buttonActive : buttonBase}
                onClick={() => setLightMode(mode)}
              >
                {LightModeIcons[mode]}
                <span>{LightModeLabels[mode]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div style={sectionTitleStyle}>采光分析</div>
        <button
          onClick={toggleDragging}
          style={isDraggingPoint ? buttonActive : { ...buttonBase, width: '100%', justifyContent: 'center' }}
        >
          {isDraggingPoint ? (
            <>
              <Lightbulb size={15} color="#FFFF00" />
              <span>点击模型表面放置采光点</span>
            </>
          ) : (
            <>
              <Lightbulb size={15} />
              <span>启用采光点放置</span>
            </>
          )}
        </button>
        <div style={{ fontSize: '11px', color: '#807890', marginTop: '8px', lineHeight: 1.5 }}>
          最多同时放置 3 个分析点，超量时自动替换最早的点。放置后会实时显示照度数值 (lux)。
        </div>
      </section>
    </div>
  );
}
