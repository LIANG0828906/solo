import React, { useState } from 'react';
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

const CELL_MIN = 4;
const CELL_MAX = 64;
const THRESH_MIN = 0.1;
const THRESH_MAX = 0.5;

const ControlPanel: React.FC<ControlPanelProps> = ({ config, onChange }) => {
  const [collapsed, setCollapsed] = useState(false);

  const update = <K extends keyof MosaicConfig>(key: K, value: MosaicConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const cellPct = ((config.cellSize - CELL_MIN) / (CELL_MAX - CELL_MIN)) * 100;
  const threshPct = ((config.colorThreshold - THRESH_MIN) / (THRESH_MAX - THRESH_MIN)) * 100;

  const sliderTrackStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: 4,
    background: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 12,
  };

  const sliderStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    boxShadow: '0 2px 8px rgba(102,126,234,0.45)',
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

  const valueBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 10px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(102,126,234,0.12) 0%, rgba(118,75,162,0.12) 100%)',
    color: '#667EEA',
    fontSize: 12,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    border: '1px solid rgba(102,126,234,0.2)',
    letterSpacing: 0.2,
  };

  if (collapsed) {
    return (
      <div
        style={{
          width: 44,
          minWidth: 44,
          background: '#FFFFFF',
          boxShadow: '-2px 0 12px rgba(0,0,0,0.08)',
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          padding: '16px 0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          transition: 'all 0.25s ease',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          title="展开控制面板"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: '#F1F5F9',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#667EEA';
            (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
            (e.currentTarget as HTMLButtonElement).style.color = '#64748B';
          }}
        >
          ▶
        </button>
        <div
          style={{
            width: 28,
            height: 1,
            background: '#E2E8F0',
          }}
        />
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 12,
            fontWeight: 600,
            color: '#94A3B8',
            letterSpacing: 2,
          }}
        >
          参数设置
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {styleOptions.map((opt) => (
            <div
              key={opt.key}
              title={opt.label}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                background:
                  config.emojiStyle === opt.key
                    ? 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
                    : '#F1F5F9',
                opacity: config.emojiStyle === opt.key ? 1 : 0.6,
              }}
            >
              {opt.icon}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div
            title={`颗粒大小 ${config.cellSize}px`}
            style={{
              width: 20,
              height: 60,
              borderRadius: 10,
              background: '#F1F5F9',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: `${cellPct}%`,
                background: 'linear-gradient(180deg, #764BA2 0%, #667EEA 100%)',
              }}
            />
          </div>
          <div
            title={`色差阈值 ${config.colorThreshold.toFixed(2)}`}
            style={{
              width: 20,
              height: 60,
              borderRadius: 10,
              background: '#F1F5F9',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: `${threshPct}%`,
                background: 'linear-gradient(180deg, #764BA2 0%, #667EEA 100%)',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

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
        transition: 'all 0.25s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
          参数设置
        </div>
        <button
          onClick={() => setCollapsed(true)}
          title="收起控制面板"
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: 'none',
            background: '#F1F5F9',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#667EEA';
            (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
            (e.currentTarget as HTMLButtonElement).style.color = '#64748B';
          }}
        >
          ◀
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>颗粒大小</span>
          <span style={valueBadgeStyle}>{config.cellSize} px</span>
        </div>
        <div
          style={sliderTrackStyle}
          onMouseDown={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const startX = e.clientX;
            const startVal = config.cellSize;
            const range = CELL_MAX - CELL_MIN;
            const onMove = (mv: MouseEvent) => {
              const dx = (mv.clientX - startX) / rect.width;
              const next = Math.min(CELL_MAX, Math.max(CELL_MIN, Math.round(startVal + dx * range)));
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
          <span>{CELL_MIN}px</span>
          <span>{CELL_MAX}px</span>
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
                  height: 44,
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  transition: 'all 0.2s ease',
                  background: active
                    ? 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
                    : '#F1F5F9',
                  color: active ? '#FFFFFF' : '#475569',
                  boxShadow: active ? '0 3px 10px rgba(102,126,234,0.35)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{opt.icon}</span>
                <span style={{ fontSize: 11, lineHeight: 1, marginTop: 2 }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>色差阈值</span>
          <span style={valueBadgeStyle}>{config.colorThreshold.toFixed(2)}</span>
        </div>
        <div
          style={sliderTrackStyle}
          onMouseDown={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const startX = e.clientX;
            const startVal = config.colorThreshold;
            const range = THRESH_MAX - THRESH_MIN;
            const onMove = (mv: MouseEvent) => {
              const dx = (mv.clientX - startX) / rect.width;
              const next = Math.min(
                THRESH_MAX,
                Math.max(THRESH_MIN, Math.round((startVal + dx * range) * 100) / 100),
              );
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
