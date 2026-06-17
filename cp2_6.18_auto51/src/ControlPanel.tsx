import React from 'react';
import { EmojiStyle } from './emojiData';

export interface MosaicConfig {
  cellSize: number;
  emojiStyle: EmojiStyle;
  colorThreshold: number;
}

interface ControlPanelProps {
  config: MosaicConfig;
  onChange: (config: MosaicConfig) => void;
}

const styleOptions: { key: EmojiStyle; label: string; icon: string }[] = [
  { key: 'classic', label: '经典', icon: '😊' },
  { key: 'animal', label: '动物', icon: '🐱' },
  { key: 'food', label: '食物', icon: '🍕' },
];

const ControlPanel: React.FC<ControlPanelProps> = ({ config, onChange }) => {
  const update = <K extends keyof MosaicConfig>(key: K, value: MosaicConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const sliderTrackStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: 4,
    background: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 8,
  };

  const sliderStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    boxShadow: '0 2px 6px rgba(102,126,234,0.4)',
    cursor: 'pointer',
    pointerEvents: 'none',
  };

  const sliderFillStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #667EEA 0%, #764BA2 100%)',
    borderRadius: 2,
    pointerEvents: 'none',
  };

  const cellPct = ((config.cellSize - 4) / (32 - 4)) * 100;
  const threshPct = ((config.colorThreshold - 0.1) / (0.5 - 0.1)) * 100;

  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        background: '#FFFFFF',
        boxShadow: '-2px 0 12px rgba(0,0,0,0.08)',
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        padding: 20,
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 24 }}>
        参数设置
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>颗粒大小</span>
          <span style={{ fontSize: 13, color: '#667EEA', fontWeight: 600 }}>{config.cellSize}px</span>
        </div>
        <div
          style={sliderTrackStyle}
          onMouseDown={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const startX = e.clientX;
            const startVal = config.cellSize;
            const onMove = (mv: MouseEvent) => {
              const dx = (mv.clientX - startX) / rect.width;
              const next = Math.min(32, Math.max(4, Math.round(startVal + dx * 28)));
              update('cellSize', next);
            };
            const onUp = () => {
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
        >
          <div style={{ ...sliderFillStyle, width: `${cellPct}%` }} />
          <div style={{ ...sliderStyle, left: `calc(${cellPct}% - 8px)` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
          <span>4px</span>
          <span>32px</span>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginBottom: 12 }}>
          Emoji 风格
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {styleOptions.map((opt) => {
            const active = config.emojiStyle === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => update('emojiStyle', opt.key)}
                style={{
                  width: 80,
                  height: 36,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'all 0.2s ease',
                  background: active ? '#667EEA' : '#F1F5F9',
                  color: active ? '#FFFFFF' : '#475569',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
                }}
              >
                <span style={{ fontSize: 14 }}>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>色差阈值</span>
          <span style={{ fontSize: 13, color: '#667EEA', fontWeight: 600 }}>{config.colorThreshold.toFixed(2)}</span>
        </div>
        <div
          style={sliderTrackStyle}
          onMouseDown={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const startX = e.clientX;
            const startVal = config.colorThreshold;
            const onMove = (mv: MouseEvent) => {
              const dx = (mv.clientX - startX) / rect.width;
              const next = Math.min(0.5, Math.max(0.1, Math.round((startVal + dx * 0.4) * 100) / 100));
              update('colorThreshold', next);
            };
            const onUp = () => {
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
        >
          <div style={{ ...sliderFillStyle, width: `${threshPct}%` }} />
          <div style={{ ...sliderStyle, left: `calc(${threshPct}% - 8px)` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
          <span>精细</span>
          <span>宽泛</span>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
