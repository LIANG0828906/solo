import React from 'react';
import { Slider } from './Slider';
import { useStore, TreeParams, Preset } from '../store/useStore';

interface ControlPanelProps {
  isMobile: boolean;
  isOpen: boolean;
}

const paramConfigs: Array<{ key: keyof TreeParams; label: string; min: number; max: number; step: number }> = [
  { key: 'angle', label: '分支角度 (°)', min: 0, max: 90, step: 1 },
  { key: 'scale', label: '长度缩放', min: 0.5, max: 0.9, step: 0.05 },
  { key: 'depth', label: '递归深度', min: 1, max: 8, step: 1 },
  { key: 'thicknessDecay', label: '粗细衰减', min: 0.3, max: 1.0, step: 0.05 },
  { key: 'randomness', label: '随机扰动 (°)', min: 0, max: 30, step: 1 },
  { key: 'leafDensity', label: '叶密度', min: 0, max: 5, step: 1 },
];

const PresetCard: React.FC<{ preset: Preset; onApply: () => void; onDelete: () => void }> = ({
  preset,
  onApply,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onApply}
      style={{
        width: 160,
        height: 64,
        backgroundColor: '#2A2A3E',
        borderRadius: 8,
        padding: 10,
        cursor: 'pointer',
        border: `1px solid ${isHovered ? '#FF6B6B' : 'transparent'}`,
        transition: 'border-color 0.3s ease',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 4,
        }}
      >
        {preset.name}
      </div>
      <div
        style={{
          color: '#8888AA',
          fontSize: 10,
        }}
      >
        角度 {preset.params.angle}° · 深度 {preset.params.depth}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          position: 'absolute',
          right: 6,
          bottom: 6,
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: 'none',
          color: '#8888AA',
          cursor: 'pointer',
          fontSize: 14,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#FF6B6B';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#8888AA';
        }}
      >
        ×
      </button>
    </div>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({ isMobile, isOpen }) => {
  const params = useStore((state) => state.params);
  const presets = useStore((state) => state.presets);
  const setParam = useStore((state) => state.setParam);
  const randomizeParams = useStore((state) => state.randomizeParams);
  const savePreset = useStore((state) => state.savePreset);
  const deletePreset = useStore((state) => state.deletePreset);
  const applyPreset = useStore((state) => state.applyPreset);
  const [randomHover, setRandomHover] = React.useState(false);

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-out',
        overflowY: 'auto' as const,
      }
    : {
        flexShrink: 0,
      };

  return (
    <div
      style={{
        width: 280,
        backgroundColor: '#12122A',
        borderRadius: 12,
        padding: 20,
        boxShadow: '4px 0 12px rgba(0, 0, 0, 0.2)',
        ...panelStyle,
      }}
    >
      <div
        style={{
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 24,
        }}
      >
        L-tree Explorer
      </div>

      {paramConfigs.map(({ key, label, min, max, step }) => (
        <Slider
          key={key}
          label={label}
          value={params[key]}
          min={min}
          max={max}
          step={step}
          onChange={(v) => setParam(key, v as never)}
        />
      ))}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: 16,
          gap: 12,
        }}
      >
        <button
          onClick={randomizeParams}
          onMouseEnter={() => setRandomHover(true)}
          onMouseLeave={() => setRandomHover(false)}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: randomHover ? '#FF5252' : '#FF6B6B',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: randomHover ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s ease',
          }}
          title="随机生成"
        >
          🎲
        </button>

        <button
          onClick={savePreset}
          style={{
            height: 40,
            padding: '0 16px',
            borderRadius: 8,
            backgroundColor: '#4A4A6E',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            flex: 1,
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C63FF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4A4A6E';
          }}
        >
          保存预设
        </button>
      </div>

      {presets.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            预设
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onApply={() => applyPreset(preset.id)}
                onDelete={() => deletePreset(preset.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
