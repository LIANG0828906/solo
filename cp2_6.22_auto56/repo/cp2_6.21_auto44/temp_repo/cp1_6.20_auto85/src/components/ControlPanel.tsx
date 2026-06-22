import { useState } from 'react';
import type { NebulaParams, Morphology, NebulaPreset } from '../types';

interface ControlPanelProps {
  params: NebulaParams;
  presets: NebulaPreset[];
  onParamChange: (key: keyof NebulaParams, value: number | Morphology) => void;
  onReset: () => void;
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: NebulaPreset) => void;
}

interface SliderConfig {
  key: keyof NebulaParams;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'particleCount', label: '粒子数量', min: 1000, max: 20000, step: 100, format: v => v.toFixed(0) },
  { key: 'gravity', label: '引力强度', min: 0, max: 5, step: 0.01, format: v => v.toFixed(2) },
  { key: 'turbulence', label: '湍流强度', min: 0, max: 3, step: 0.01, format: v => v.toFixed(2) },
  { key: 'dissipation', label: '消散速率', min: 0, max: 0.1, step: 0.001, format: v => v.toFixed(3) },
  { key: 'colorShift', label: '颜色偏移', min: 0, max: 1, step: 0.01, format: v => v < 0.5 ? '暖色' : v > 0.5 ? '冷色' : '中性' },
];

const MORPHOLOGY_OPTIONS: { value: Morphology; label: string }[] = [
  { value: 'spiral', label: '螺旋星云' },
  { value: 'elliptical', label: '椭圆星云' },
  { value: 'irregular', label: '不规则星云' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  presets,
  onParamChange,
  onReset,
  onSavePreset,
  onLoadPreset,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handleSave = () => {
    if (saveName.trim()) {
      onSavePreset(saveName.trim());
      setSaveName('');
      setShowSaveInput(false);
    }
  };

  const panelContent = (
    <>
      <div style={styles.header}>
        <h2 style={styles.title}>星云控制台</h2>
        <button
          style={styles.collapseBtn}
          onClick={() => {
            setCollapsed(!collapsed);
            setShowMobile(false);
          }}
          aria-label="折叠面板"
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {!collapsed && (
        <div style={styles.content}>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>物理参数</div>
            {SLIDERS.map((slider) => (
              <div key={slider.key} style={styles.sliderRow}>
                <div style={styles.sliderLabel}>
                  <span>{slider.label}</span>
                  <span style={styles.sliderValue}>
                    {slider.format(params[slider.key] as number)}
                  </span>
                </div>
                <div style={styles.sliderWrapper}>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={params[slider.key] as number}
                    onChange={(e) => onParamChange(slider.key, parseFloat(e.target.value))}
                    style={styles.sliderInput}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>星云形态</div>
            <select
              value={params.morphology}
              onChange={(e) => onParamChange('morphology', e.target.value as Morphology)}
              style={styles.select}
            >
              {MORPHOLOGY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>预设管理</div>
            <div style={styles.buttonRow}>
              <button style={styles.button} onClick={onReset}>重置参数</button>
              <button style={styles.button} onClick={() => setShowSaveInput(!showSaveInput)}>
                保存预设
              </button>
            </div>
            {showSaveInput && (
              <div style={styles.saveRow}>
                <input
                  type="text"
                  placeholder="输入预设名称..."
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  style={styles.textInput}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button style={styles.buttonSmall} onClick={handleSave}>确认</button>
              </div>
            )}
            <button style={styles.buttonFull} onClick={() => setShowPresets(!showPresets)}>
              {showPresets ? '隐藏预设列表' : '加载预设'} ▼
            </button>
            {showPresets && (
              <div style={styles.presetList}>
                {presets.map(preset => (
                  <button
                    key={preset.id}
                    style={{
                      ...styles.presetItem,
                      borderColor: preset.isBuiltIn ? 'rgba(99,102,241,0.4)' : 'rgba(255,107,53,0.4)',
                    }}
                    onClick={() => {
                      onLoadPreset(preset);
                      setShowPresets(false);
                    }}
                  >
                    <span style={styles.presetName}>{preset.name}</span>
                    <span style={styles.presetBadge}>
                      {preset.isBuiltIn ? '内置' : '自定义'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={styles.footer}>
            <div style={styles.hint}>💡 拖拽旋转 · 滚轮缩放 · 右键平移 · 点击触发粒子波</div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div style={{
        ...styles.panel,
        transform: collapsed ? 'translateX(calc(-100% + 40px))' : 'translateX(0)',
      }} className="control-panel-desktop">
        {panelContent}
      </div>

      <button
        style={styles.mobileButton}
        className="control-panel-mobile-btn"
        onClick={() => setShowMobile(true)}
        aria-label="打开控制面板"
      >
        <span style={{ fontSize: 24 }}>⚙</span>
      </button>

      {showMobile && (
        <>
          <div style={styles.overlay} onClick={() => setShowMobile(false)} />
          <div style={styles.mobilePanel}>
            <div style={{ ...styles.header, borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <h2 style={styles.title}>星云控制台</h2>
              <button style={styles.collapseBtn} onClick={() => setShowMobile(false)}>✕</button>
            </div>
            <div style={{ ...styles.content, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
              {panelContent}
            </div>
          </div>
        </>
      )}

      <style>{cssStyles}</style>
    </>
  );
};

const cssStyles = `
  .control-panel-desktop { display: flex; }
  .control-panel-mobile-btn { display: none; }
  @media (max-width: 768px) {
    .control-panel-desktop { display: none !important; }
    .control-panel-mobile-btn { display: flex !important; }
  }
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, rgba(99,102,241,0.3), rgba(99,102,241,0.6));
    border-radius: 3px;
    outline: none;
    box-shadow: 0 0 8px rgba(99,102,241,0.3);
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: radial-gradient(circle, #818cf8 0%, #6366f1 60%, #4f46e5 100%);
    cursor: pointer;
    box-shadow: 0 0 12px rgba(99,102,241,0.8), 0 0 24px rgba(99,102,241,0.4);
    transition: box-shadow 0.2s, transform 0.1s;
    border: none;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    box-shadow: 0 0 16px rgba(99,102,241,1), 0 0 32px rgba(99,102,241,0.6);
  }
  input[type="range"]::-webkit-slider-thumb:active {
    transform: scale(1.15);
  }
  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: radial-gradient(circle, #818cf8 0%, #6366f1 60%, #4f46e5 100%);
    cursor: pointer;
    box-shadow: 0 0 12px rgba(99,102,241,0.8);
    border: none;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: rgba(15,15,35,0.3); }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.6); }
`;

const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    background: 'rgba(15, 15, 35, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(99, 102, 241, 0.25)',
    boxShadow: '4px 0 24px rgba(0,0,0,0.4), inset 0 0 40px rgba(99,102,241,0.05)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 16px',
  },
  title: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#e0e7ff',
    letterSpacing: 1.5,
    background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  collapseBtn: {
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    color: '#a5b4fc',
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    transition: 'all 0.2s',
    padding: 0,
    fontFamily: "'Space Mono', monospace",
  },
  content: {
    flex: 1,
    padding: '0 16px 20px',
    overflowY: 'auto',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: '#818cf8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: '1px solid rgba(99,102,241,0.15)',
  },
  sliderRow: {
    marginBottom: 14,
  },
  sliderLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#c7d2fe',
  },
  sliderValue: {
    color: '#a5b4fc',
    fontSize: 11,
    background: 'rgba(99,102,241,0.15)',
    padding: '2px 8px',
    borderRadius: 4,
  },
  sliderWrapper: {
    padding: '4px 0',
  },
  sliderInput: {
    width: '100%',
    cursor: 'pointer',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(15,15,35,0.8)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 6,
    color: '#e0e7ff',
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 0 8px rgba(99,102,241,0.1)',
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    padding: '10px 12px',
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 6,
    color: '#c7d2fe',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 8px rgba(99,102,241,0.1)',
  },
  buttonSmall: {
    padding: '8px 14px',
    background: 'rgba(99,102,241,0.25)',
    border: '1px solid rgba(99,102,241,0.4)',
    borderRadius: 6,
    color: '#e0e7ff',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    cursor: 'pointer',
  },
  buttonFull: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: 6,
    color: '#a5b4fc',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    cursor: 'pointer',
    marginBottom: 8,
  },
  saveRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    padding: '8px 12px',
    background: 'rgba(15,15,35,0.8)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 6,
    color: '#e0e7ff',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    outline: 'none',
  },
  presetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 200,
    overflowY: 'auto',
  },
  presetItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'rgba(15,15,35,0.6)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  presetName: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#e0e7ff',
  },
  presetBadge: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 4,
    background: 'rgba(99,102,241,0.2)',
    color: '#a5b4fc',
    fontFamily: "'Space Mono', monospace",
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '1px solid rgba(99,102,241,0.15)',
  },
  hint: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#6366f1',
    lineHeight: 1.6,
    textAlign: 'center',
  },
  mobileButton: {
    position: 'fixed',
    left: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(15,15,35,0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(99,102,241,0.4)',
    color: '#a5b4fc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 100,
    boxShadow: '0 0 20px rgba(99,102,241,0.4)',
    padding: 0,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 150,
  },
  mobilePanel: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    background: 'rgba(10,10,26,0.95)',
    backdropFilter: 'blur(30px)',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.3s ease-out',
  },
};
