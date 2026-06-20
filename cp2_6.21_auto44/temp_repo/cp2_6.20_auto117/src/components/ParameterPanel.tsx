import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const THEME_OPTIONS = [
  { key: 'autumn' as const, label: '秋意浓', colors: ['#c4650a', '#8b6914', '#6b4c3b'] },
  { key: 'spring' as const, label: '江南春', colors: ['#5a9e6f', '#3a8a5a', '#8ab8a0'] },
  { key: 'winter' as const, label: '雪夜', colors: ['#4a6a9a', '#6a8ab0', '#a0b8d0'] },
];

const ParameterPanel: React.FC = () => {
  const { brushDensity, theme, animSpeed, setBrushDensity, setTheme, setAnimSpeed } =
    useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div style={styles.collapsedWrap}>
        <button style={styles.collapseBtn} onClick={() => setCollapsed(false)} title="展开参数面板">
          ◀
        </button>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <span style={styles.panelTitle}>参数调整</span>
        <button style={styles.collapseBtn} onClick={() => setCollapsed(true)} title="折叠">
          ▶
        </button>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>
          笔触浓度 <span style={styles.value}>{brushDensity}</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={brushDensity}
          onChange={(e) => setBrushDensity(Number(e.target.value))}
          style={styles.slider}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>整体色调</label>
        <div style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              style={{
                ...styles.themeBtn,
                ...(theme === opt.key ? styles.themeBtnActive : {}),
              }}
              onClick={() => setTheme(opt.key)}
            >
              <div style={styles.themeColors}>
                {opt.colors.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      ...styles.themeSwatch,
                      background: c,
                    }}
                  />
                ))}
              </div>
              <span style={styles.themeLabel}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>
          动画速度 <span style={styles.value}>{animSpeed}×</span>
        </label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.5}
          value={animSpeed}
          onChange={(e) => setAnimSpeed(Number(e.target.value))}
          style={styles.slider}
        />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  collapsedWrap: {
    width: 28,
    display: 'flex',
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  panel: {
    width: 220,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    alignSelf: 'flex-start',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#444',
  },
  collapseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: '#aaa',
    padding: '4px 6px',
    borderRadius: 4,
    transition: 'color 0.2s',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  value: {
    fontWeight: 600,
    color: '#333',
  },
  slider: {
    width: '100%',
    accentColor: '#2d6a4f',
    cursor: 'pointer',
  },
  themeRow: {
    display: 'flex',
    gap: 6,
  },
  themeBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    padding: '8px 4px',
    border: '2px solid transparent',
    borderRadius: 8,
    background: '#f8f8f5',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  themeBtnActive: {
    borderColor: '#2d6a4f',
    background: '#eef5ee',
  },
  themeColors: {
    display: 'flex',
    gap: 3,
  },
  themeSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    display: 'block',
  },
  themeLabel: {
    fontSize: 10,
    color: '#888',
  },
};

export default ParameterPanel;
