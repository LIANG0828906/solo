import React, { useState } from 'react';
import type { FontConfig, PresetConfig } from './fontPresets';
import { SYSTEM_FONTS, FONT_PRESETS } from './fontPresets';

interface ControlPanelProps {
  singleConfig: FontConfig;
  compareConfigs: FontConfig[];
  compareMode: boolean;
  activeIndex: number;
  onSingleConfigChange: (config: FontConfig) => void;
  onCompareConfigChange: (index: number, config: FontConfig) => void;
  onCompareModeChange: (enabled: boolean) => void;
  onActiveIndexChange: (index: number) => void;
  onApplyPreset: (preset: PresetConfig) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  singleConfig,
  compareConfigs,
  compareMode,
  activeIndex,
  onSingleConfigChange,
  onCompareConfigChange,
  onCompareModeChange,
  onActiveIndexChange,
  onApplyPreset,
}) => {
  const [pressingPreset, setPressingPreset] = useState<number | null>(null);

  const currentConfig = compareMode ? compareConfigs[activeIndex] : singleConfig;
  const handleConfigChange = (patch: Partial<FontConfig>) => {
    if (compareMode) {
      const newConfigs = [...compareConfigs];
      newConfigs[activeIndex] = { ...newConfigs[activeIndex], ...patch };
      onCompareConfigChange(activeIndex, newConfigs[activeIndex]);
    } else {
      onSingleConfigChange({ ...singleConfig, ...patch });
    }
  };

  const handlePresetMouseDown = (idx: number) => setPressingPreset(idx);
  const handlePresetMouseUp = () => setPressingPreset(null);
  const handlePresetMouseLeave = () => setPressingPreset(null);

  const handlePresetClick = (preset: PresetConfig) => {
    onApplyPreset(preset);
  };

  return (
    <aside style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>字体排版控制</h2>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>对比模式</label>
        <div style={toggleContainerStyle}>
          <button
            onClick={() => onCompareModeChange(false)}
            style={{
              ...toggleBtnStyle,
              ...(!compareMode ? toggleBtnActiveStyle : {}),
            }}
          >
            单组
          </button>
          <button
            onClick={() => onCompareModeChange(true)}
            style={{
              ...toggleBtnStyle,
              ...(compareMode ? toggleBtnActiveStyle : {}),
            }}
          >
            四组对比
          </button>
        </div>
      </div>

      {compareMode && (
        <div style={sectionStyle}>
          <label style={labelStyle}>当前编辑格子</label>
          <div style={gridSelectStyle}>
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                onClick={() => onActiveIndexChange(idx)}
                style={{
                  ...cellBtnStyle,
                  ...(activeIndex === idx ? cellBtnActiveStyle : {}),
                }}
              >
                格子 {idx + 1}
                <span style={cellFontNameStyle}>
                  {compareConfigs[idx]?.fontFamily.split(',')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={sectionStyle}>
        <label style={labelStyle}>字体选择</label>
        <div style={selectWrapperStyle}>
          <select
            value={currentConfig.fontFamily}
            onChange={(e) => handleConfigChange({ fontFamily: e.target.value })}
            style={selectStyle}
          >
            {SYSTEM_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
            <option value="system-ui">system-ui</option>
          </select>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          字号 <span style={valueBadgeStyle}>{currentConfig.fontSize}px</span>
        </label>
        <input
          type="range"
          min={12}
          max={72}
          step={2}
          value={currentConfig.fontSize}
          onChange={(e) => handleConfigChange({ fontSize: Number(e.target.value) })}
          style={sliderStyle}
        />
        <div style={sliderTicksStyle}>
          <span>12</span>
          <span>42</span>
          <span>72</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          行高 <span style={valueBadgeStyle}>{currentConfig.lineHeight.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={1.0}
          max={2.0}
          step={0.1}
          value={currentConfig.lineHeight}
          onChange={(e) => handleConfigChange({ lineHeight: Number(e.target.value) })}
          style={sliderStyle}
        />
        <div style={sliderTicksStyle}>
          <span>1.0</span>
          <span>1.5</span>
          <span>2.0</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>字重</label>
        <div style={toggleContainerStyle}>
          <button
            onClick={() => handleConfigChange({ fontWeight: 'normal' })}
            style={{
              ...toggleBtnStyle,
              ...(currentConfig.fontWeight === 'normal' ? toggleBtnActiveStyle : {}),
            }}
          >
            正常
          </button>
          <button
            onClick={() => handleConfigChange({ fontWeight: 'bold' })}
            style={{
              ...toggleBtnStyle,
              ...(currentConfig.fontWeight === 'bold' ? toggleBtnActiveStyle : {}),
            }}
          >
            加粗
          </button>
        </div>
      </div>

      <div style={{ ...sectionStyle, marginTop: 'auto' }}>
        <label style={labelStyle}>快速预设</label>
        <div style={presetGridStyle}>
          {FONT_PRESETS.map((preset, idx) => (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              onMouseDown={() => handlePresetMouseDown(idx)}
              onMouseUp={handlePresetMouseUp}
              onMouseLeave={handlePresetMouseLeave}
              style={{
                ...presetBtnStyle,
                transform: pressingPreset === idx ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.1s ease-out',
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <style>{customSliderCss}</style>
    </aside>
  );
};

const panelStyle: React.CSSProperties = {
  width: 320,
  minWidth: 320,
  height: '100vh',
  backgroundColor: '#F9FAFB',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  boxSizing: 'border-box',
  overflowY: 'auto',
};

const headerStyle: React.CSSProperties = {
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: '#1F2937',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '14px 0',
  borderBottom: '1px solid #E5E7EB',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const valueBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 48,
  padding: '2px 8px',
  backgroundColor: '#3B82F6',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 999,
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: 6,
  appearance: 'none',
  WebkitAppearance: 'none',
  background: '#E5E7EB',
  borderRadius: 999,
  outline: 'none',
  cursor: 'pointer',
};

const customSliderCss = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: #3B82F6;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: box-shadow 0.15s;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    box-shadow: 0 2px 6px rgba(59,130,246,0.4);
  }
  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: #3B82F6;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
`;

const sliderTicksStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 11,
  color: '#9CA3AF',
};

const toggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  backgroundColor: '#E5E7EB',
  padding: 3,
  borderRadius: 8,
};

const toggleBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  border: 'none',
  borderRadius: 6,
  backgroundColor: 'transparent',
  color: '#4B5563',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const toggleBtnActiveStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  color: '#1F2937',
  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
};

const selectWrapperStyle: React.CSSProperties = {
  position: 'relative',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 36px 10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  backgroundColor: '#fff',
  color: '#1F2937',
  fontSize: 14,
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  transition: 'border-color 0.15s',
};

const gridSelectStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 6,
};

const cellBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 2,
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  backgroundColor: '#fff',
  color: '#4B5563',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  textAlign: 'left',
};

const cellBtnActiveStyle: React.CSSProperties = {
  borderColor: '#3B82F6',
  backgroundColor: '#EFF6FF',
  color: '#1D4ED8',
  boxShadow: '0 0 0 2px rgba(59,130,246,0.15)',
};

const cellFontNameStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 400,
  opacity: 0.75,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
};

const presetGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

const presetBtnStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #3B82F6',
  borderRadius: 8,
  backgroundColor: '#fff',
  color: '#3B82F6',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.1s ease-out',
};

export default ControlPanel;
