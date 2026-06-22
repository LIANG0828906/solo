import React from 'react';
import { ThemeType, FontStyle, CloudConfig, AnalyzeResult } from './types';

interface ControlPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  theme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  config: CloudConfig;
  onConfigChange: (config: CloudConfig) => void;
  result: AnalyzeResult | null;
  isLoading: boolean;
  onExportPNG: () => void;
  onExportSVG: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const themes: { key: ThemeType; label: string; icon: string }[] = [
  { key: 'light', label: '明亮', icon: '☀️' },
  { key: 'dark', label: '暗黑', icon: '🌙' },
  { key: 'retro', label: '复古', icon: '📜' },
  { key: 'minimal', label: '极简', icon: '◻️' },
];

const fontOptions: { key: FontStyle; label: string }[] = [
  { key: 'sans-serif', label: '无衬线体' },
  { key: 'serif', label: '衬线体' },
  { key: 'handwriting', label: '手写体' },
];

function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const button = e.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  
  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - radius}px`;
  circle.style.top = `${e.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');
  
  const existingRipple = button.getElementsByClassName('ripple')[0];
  if (existingRipple) {
    existingRipple.remove();
  }
  
  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  text,
  onTextChange,
  theme,
  onThemeChange,
  config,
  onConfigChange,
  result,
  isLoading,
  onExportPNG,
  onExportSVG,
  isOpen,
  onClose,
}) => {
  return (
    <>
      <div className={`overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`control-panel ${isOpen ? 'open' : ''}`}>
        <div className="stats-bar">
          <div className="stats-item">
            <span className="stats-label">总词数</span>
            <span className="stats-value">{result?.totalWords || 0}</span>
          </div>
          <div className="stats-item">
            <span className="stats-label">已显示</span>
            <span className="stats-value">{result?.words.length || 0}</span>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-title">文本输入</div>
          <textarea
            className="text-input"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="请在此输入或粘贴文本内容，支持中英文混合输入...&#10;&#10;输入完成后系统将自动分析词频并生成词云。"
            spellCheck={false}
          />
          {isLoading && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#4f8cff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              正在分析文本...
            </div>
          )}
        </div>

        <div className="panel-section">
          <div className="panel-title">视觉主题</div>
          <div className="theme-buttons">
            {themes.map((t) => (
              <button
                key={t.key}
                className={`theme-btn ${t.key} ${theme === t.key ? 'active' : ''}`}
                onClick={() => onThemeChange(t.key)}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-title">自定义参数</div>

          <div className="slider-container">
            <div className="slider-label">
              <span>最大词语数量</span>
              <span className="slider-value">{config.maxWords}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={20}
              max={200}
              value={config.maxWords}
              onChange={(e) => onConfigChange({ ...config, maxWords: parseInt(e.target.value) })}
            />
          </div>

          <div className="slider-container">
            <div className="slider-label">
              <span>字体样式</span>
            </div>
            <select
              className="font-select"
              value={config.fontStyle}
              onChange={(e) => onConfigChange({ ...config, fontStyle: e.target.value as FontStyle })}
            >
              {fontOptions.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="slider-container">
            <div className="slider-label">
              <span>旋转角度</span>
              <span className="slider-value">{config.rotation}°</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={90}
              value={config.rotation}
              onChange={(e) => onConfigChange({ ...config, rotation: parseInt(e.target.value) })}
            />
          </div>

          <div className="slider-container">
            <div className="slider-label">
              <span>布局紧凑度</span>
              <span className="slider-value">{Math.round(config.compactness * 100)}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={50}
              max={120}
              value={Math.round(config.compactness * 100)}
              onChange={(e) => onConfigChange({ ...config, compactness: parseInt(e.target.value) / 100 })}
            />
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-title">导出词云</div>
          <div className="export-buttons">
            <button
              className="export-btn primary"
              onClick={(e) => { createRipple(e); onExportPNG(); }}
              disabled={!result || result.words.length === 0}
              style={{ opacity: (!result || result.words.length === 0) ? 0.5 : 1 }}
            >
              🖼️ PNG
            </button>
            <button
              className="export-btn secondary"
              onClick={(e) => { createRipple(e); onExportSVG(); }}
              disabled={!result || result.words.length === 0}
              style={{ opacity: (!result || result.words.length === 0) ? 0.5 : 1 }}
            >
              📐 SVG
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ControlPanel;
