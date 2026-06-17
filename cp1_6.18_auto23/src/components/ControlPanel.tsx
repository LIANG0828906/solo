import React, { useCallback } from 'react';
import { useStore, selectSeed, selectSetSeed, selectApplyPreset } from '@store/stateManager';
import { PRESETS, SEED_RANGES, SeedParams } from '@/types';

interface ControlPanelProps {
  isMobile: boolean;
}

interface SliderConfig {
  key: keyof SeedParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
}

const sliders: SliderConfig[] = [
  {
    key: 'spiralRadius',
    label: '螺旋半径 Spiral Radius',
    min: SEED_RANGES.spiralRadius.min,
    max: SEED_RANGES.spiralRadius.max,
    step: 0.01,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'branchDensity',
    label: '分支密度 Branch Density',
    min: SEED_RANGES.branchDensity.min,
    max: SEED_RANGES.branchDensity.max,
    step: 0.01,
    format: (v) => v.toFixed(2),
  },
  {
    key: 'colorFlux',
    label: '颜色通量 Color Flux',
    min: SEED_RANGES.colorFlux.min,
    max: SEED_RANGES.colorFlux.max,
    step: 0.1,
    format: (v) => v.toFixed(1) + '%',
  },
];

const ControlPanel: React.FC<ControlPanelProps> = ({ isMobile }) => {
  const seed = useStore(selectSeed);
  const setSeed = useStore(selectSetSeed);
  const applyPreset = useStore(selectApplyPreset);

  const handleSliderChange = useCallback(
    (key: keyof SeedParams, value: number) => {
      setSeed({ [key]: value });
    },
    [setSeed]
  );

  const handlePresetClick = useCallback(
    (presetId: string) => {
      applyPreset(presetId);
    },
    [applyPreset]
  );

  const panelStyle: React.CSSProperties = isMobile
    ? {
        width: '100%',
        height: 'auto',
        maxHeight: '45vh',
        overflowY: 'auto' as const,
        flexShrink: 0,
        background: 'rgba(10,14,39,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid #2A2A4A',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
        zIndex: 10,
      }
    : {
        width: '320px',
        flexShrink: 0,
        background: 'rgba(10,14,39,0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRight: '1px solid #2A2A4A',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
        overflowY: 'auto' as const,
        zIndex: 10,
      };

  const titleStyle: React.CSSProperties = {
    color: '#FFFFFF',
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '4px',
    letterSpacing: '1px',
    textShadow: '0 0 20px rgba(91,141,239,0.5)',
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6A6A9A',
    fontSize: '12px',
    marginBottom: '8px',
    letterSpacing: '2px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: '#8A8ABA',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  };

  return (
    <div style={panelStyle}>
      <div>
        <div style={titleStyle}>分子花园</div>
        <div style={subtitleStyle}>MOLECULAR GARDEN</div>
      </div>

      <div>
        <div style={sectionTitleStyle}>基因参数 Genome</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          {sliders.map((slider) => (
            <SliderRow
              key={slider.key}
              config={slider}
              value={seed[slider.key]}
              onChange={(v) => handleSliderChange(slider.key, v)}
            />
          ))}
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>预设种子 Presets</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {PRESETS.map((preset) => (
            <PresetButton
              key={preset.id}
              presetId={preset.id}
              name={preset.name}
              onClick={() => handlePresetClick(preset.id)}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #2A2A4A' }}>
        <div style={{ color: '#5A5A8A', fontSize: '11px', lineHeight: 1.6 }}>
          拖拽画面弯曲植物 · 悬停节点放大<br />
          点击节点触发射散效果
        </div>
      </div>
    </div>
  );
};

interface SliderRowProps {
  config: SliderConfig;
  value: number;
  onChange: (value: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({ config, value, onChange }) => {
  const percentage = ((value - config.min) / (config.max - config.min)) * 100;

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const labelStyle: React.CSSProperties = {
    color: '#B0B0D0',
    fontSize: '14px',
    fontWeight: 400,
  };

  const valueStyle: React.CSSProperties = {
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    minWidth: '60px',
    textAlign: 'right' as const,
    textShadow: '0 0 8px rgba(91,141,239,0.4)',
  };

  const trackContainerStyle: React.CSSProperties = {
    position: 'relative',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  };

  const trackStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: 'linear-gradient(to right, rgba(91,141,239,0.6) 0%, rgba(91,141,239,0.2) 100%)',
    overflow: 'hidden',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    width: `${percentage}%`,
    background: 'linear-gradient(to right, #5B8DEF, #9B5BEF)',
    borderRadius: '2px',
    transition: 'width 0.1s ease-out',
    boxShadow: '0 0 10px rgba(91,141,239,0.6)',
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    left: `calc(${percentage}% - 10px)`,
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(91,141,239,0.35)',
    border: '2px solid #5B8DEF',
    cursor: 'grab',
    transition: 'transform 0.1s ease-out, box-shadow 0.15s ease-out',
    boxShadow: '0 0 12px rgba(91,141,239,0.5), inset 0 0 6px rgba(91,141,239,0.3)',
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();

    const updateValue = (clientX: number) => {
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const pct = x / rect.width;
      const newValue = config.min + pct * (config.max - config.min);
      onChange(Math.max(config.min, Math.min(config.max, newValue)));
    };

    updateValue(e.clientX);

    const handleMove = (ev: MouseEvent) => {
      updateValue(ev.clientX);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();

    const updateValue = (clientX: number) => {
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const pct = x / rect.width;
      const newValue = config.min + pct * (config.max - config.min);
      onChange(Math.max(config.min, Math.min(config.max, newValue)));
    };

    updateValue(e.touches[0].clientX);

    const handleMove = (ev: TouchEvent) => {
      updateValue(ev.touches[0].clientX);
    };

    const handleEnd = () => {
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  return (
    <div style={rowStyle}>
      <div style={labelRowStyle}>
        <span style={labelStyle}>{config.label}</span>
        <span style={valueStyle}>{config.format ? config.format(value) : value}</span>
      </div>
      <div
        style={trackContainerStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div style={trackStyle}>
          <div style={fillStyle} />
        </div>
        <div
          style={thumbStyle}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.15)';
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 0 18px rgba(91,141,239,0.8), inset 0 0 8px rgba(91,141,239,0.5)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 0 12px rgba(91,141,239,0.5), inset 0 0 6px rgba(91,141,239,0.3)';
          }}
        />
      </div>
    </div>
  );
};

interface PresetButtonProps {
  presetId: string;
  name: string;
  onClick: () => void;
}

const PresetButton: React.FC<PresetButtonProps> = ({ name, onClick }) => {
  const buttonStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#2A2A4A',
    color: '#D0D0FF',
    border: 'none',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease-out',
    letterSpacing: '0.5px',
  };

  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = '#3A3A6A';
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 0 15px rgba(91,141,239,0.3)';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = '#2A2A4A';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)';
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(2px)';
      }}
    >
      {name}
    </button>
  );
};

export default ControlPanel;
