import React, { useCallback } from 'react';
import { useStore } from '../store';
import { ThemeMode, ThemeScheme } from '../utils/colorUtils';

interface TabProps {
  mode: ThemeMode;
  label: string;
  active: boolean;
  onClick: () => void;
  scheme: ThemeScheme;
}

const Tab: React.FC<TabProps> = React.memo(({ mode: _mode, label, active, onClick, scheme }) => {
  return (
    <button
      className={`tab-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      style={{
        backgroundColor: active ? scheme.primary : 'transparent',
        color: active ? '#FFFFFF' : scheme.text,
        borderColor: scheme.border
      }}
    >
      {label}
    </button>
  );
});

Tab.displayName = 'Tab';

interface PreviewCardProps {
  scheme: ThemeScheme;
  mode: ThemeMode;
}

const PreviewCard: React.FC<PreviewCardProps> = React.memo(({ scheme, mode }) => {
  const cardStyle: React.CSSProperties = mode === 'glass' ? {
    background: `linear-gradient(135deg, ${scheme.primary}20 0%, ${scheme.secondary}10 100%)`,
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    border: scheme.border,
    borderRadius: '16px'
  } : {
    backgroundColor: scheme.cardBg,
    border: `1px solid ${scheme.border}`,
    borderRadius: '12px'
  };

  return (
    <div className="preview-card" style={cardStyle}>
      <h2 className="preview-title" style={{ color: scheme.text }}>
        {mode === 'light' ? '浅色模式' : mode === 'dark' ? '深色模式' : '毛玻璃模式'}
      </h2>
      <p className="preview-subtitle" style={{ color: scheme.text + 'CC' }}>
        这是一个预览卡片，展示在{mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '毛玻璃'}模式下的UI效果
      </p>

      <div className="preview-section">
        <button
          className="preview-btn primary"
          style={{
            backgroundColor: scheme.primary,
            color: '#FFFFFF',
            boxShadow: `inset 0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)`
          }}
        >
          主要按钮
        </button>
        <button
          className="preview-btn secondary"
          style={{
            backgroundColor: scheme.cardBg,
            color: scheme.primary,
            border: `2px solid ${scheme.primary}`,
            boxShadow: `inset 0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)`
          }}
        >
          次要按钮
        </button>
      </div>

      <div className="preview-section">
        <label className="preview-label" style={{ color: scheme.text }}>输入框示例</label>
        <input
          type="text"
          className="preview-input"
          placeholder="请输入内容..."
          style={{
            backgroundColor: scheme.inputBg,
            color: scheme.text,
            border: `1px solid ${scheme.border}`
          }}
        />
      </div>

      <div className="preview-color-swatches">
        <div className="swatch-label" style={{ color: scheme.text }}>配色参考：</div>
        <div className="swatch-row">
          <div className="swatch-item">
            <div className="swatch-color" style={{ backgroundColor: scheme.primary }}></div>
            <span className="swatch-hex" style={{ color: scheme.text }}>主色</span>
          </div>
          <div className="swatch-item">
            <div className="swatch-color" style={{ backgroundColor: scheme.secondary }}></div>
            <span className="swatch-hex" style={{ color: scheme.text }}>辅助色</span>
          </div>
          <div className="swatch-item">
            <div className="swatch-color" style={{ backgroundColor: scheme.accent }}></div>
            <span className="swatch-hex" style={{ color: scheme.text }}>强调色</span>
          </div>
          <div className="swatch-item">
            <div className="swatch-color" style={{ backgroundColor: scheme.background, border: `1px solid ${scheme.border}` }}></div>
            <span className="swatch-hex" style={{ color: scheme.text }}>背景</span>
          </div>
        </div>
      </div>
    </div>
  );
});

PreviewCard.displayName = 'PreviewCard';

const PreviewPanel: React.FC = React.memo(() => {
  const { currentMode, setMode, schemes } = useStore();

  const handleSetMode = useCallback((mode: ThemeMode) => {
    setMode(mode);
  }, [setMode]);

  const currentScheme = schemes[currentMode];
  const tabs: { mode: ThemeMode; label: string }[] = [
    { mode: 'light', label: '浅色' },
    { mode: 'dark', label: '深色' },
    { mode: 'glass', label: '毛玻璃' }
  ];

  return (
    <div className="preview-panel">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <Tab
            key={tab.mode}
            mode={tab.mode}
            label={tab.label}
            active={currentMode === tab.mode}
            onClick={() => handleSetMode(tab.mode)}
            scheme={currentScheme}
          />
        ))}
      </div>
      <div className="preview-content">
        <PreviewCard scheme={currentScheme} mode={currentMode} />
      </div>
    </div>
  );
});

PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;
