import React from 'react';
import { ShapeType, ColorTheme } from './types';

const THEMES: ColorTheme[] = [
  {
    name: 'neon',
    label: '霓虹赛博',
    colors: ['#FF00FF', '#00FFFF', '#FF1493', '#7B68EE', '#00FF7F', '#FFD700'],
  },
  {
    name: 'retro',
    label: '复古暖阳',
    colors: ['#FF6B35', '#F7C59F', '#E8A87C', '#D4A373', '#CCD5AE', '#E9EDC9'],
  },
  {
    name: 'aurora',
    label: '极光幻彩',
    colors: ['#00C9A7', '#845EC2', '#FF6F91', '#FFC75F', '#F9F871', '#4B4453'],
  },
  {
    name: 'winter',
    label: '冬日极简',
    colors: ['#A8DADC', '#457B9D', '#E63946', '#F1FAEE', '#1D3557', '#9DB4C0'],
  },
  {
    name: 'candy',
    label: '糖果缤纷',
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'],
  },
];

export { THEMES };

interface ControlPanelProps {
  text: string;
  minWords: number;
  shape: ShapeType;
  theme: ColorTheme;
  onTextChange: (text: string) => void;
  onMinWordsChange: (val: number) => void;
  onShapeChange: (shape: ShapeType) => void;
  onThemeChange: (theme: ColorTheme) => void;
  onSavePNG: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  text,
  minWords,
  shape,
  theme,
  onTextChange,
  onMinWordsChange,
  onShapeChange,
  onThemeChange,
  onSavePNG,
}) => {
  const sliderPercent = ((minWords - 10) / 70) * 100;
  const sliderBg = `linear-gradient(to right, #6366F1 0%, #6366F1 ${sliderPercent}%, #334155 ${sliderPercent}%, #334155 100%)`;

  return (
    <div
      className="control-panel"
      style={{
        width: 320,
        background: '#1E293B',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          style={{
            color: '#94A3B8',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          输入文本
        </label>
        <textarea
          className="control-textarea"
          placeholder="在此粘贴文本或博客文章..."
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <label
            style={{
              color: '#94A3B8',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            展示词数
          </label>
          <span
            style={{
              color: '#6366F1',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            {minWords}
          </span>
        </div>
        <input
          type="range"
          className="control-slider"
          min={10}
          max={80}
          value={minWords}
          onChange={(e) => onMinWordsChange(Number(e.target.value))}
          style={{ background: sliderBg }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: '#475569',
          }}
        >
          <span>10</span>
          <span>80</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          style={{
            color: '#94A3B8',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          形状
        </label>
        <select
          className="control-select"
          value={shape}
          onChange={(e) => onShapeChange(e.target.value as ShapeType)}
        >
          <option value="circle">圆形</option>
          <option value="heart">心形</option>
          <option value="cloud">云朵</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label
          style={{
            color: '#94A3B8',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          配色主题
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {THEMES.map((t) => (
            <button
              key={t.name}
              className={`theme-btn${theme.name === t.name ? ' active' : ''}`}
              onClick={() => onThemeChange(t)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
          {theme.colors.map((c, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: c,
                border: '1.5px solid rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        <button className="save-btn" onClick={onSavePNG}>
          保存为 PNG
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
