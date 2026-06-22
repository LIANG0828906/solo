import React, { useState } from 'react';
import ControlPanel from './ControlPanel';
import PreviewArea from './PreviewArea';
import type { FontConfig, PresetConfig } from './fontPresets';
import { createDefaultConfig, createFourDefaults } from './fontPresets';

const App: React.FC = () => {
  const [singleConfig, setSingleConfig] = useState<FontConfig>(createDefaultConfig('Arial'));
  const [compareConfigs, setCompareConfigs] = useState<FontConfig[]>(createFourDefaults());
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const handleCompareConfigChange = (index: number, config: FontConfig) => {
    setCompareConfigs((prev) => {
      const next = [...prev];
      next[index] = config;
      return next;
    });
  };

  const handleCompareModeChange = (enabled: boolean) => {
    if (enabled && !compareMode) {
      setCompareConfigs((prev) => {
        if (prev.length === 4) {
          const next = [...prev];
          next[activeIndex] = { ...singleConfig };
          return next;
        }
        return createFourDefaults();
      });
    } else if (!enabled && compareMode) {
      setSingleConfig({ ...compareConfigs[activeIndex] });
    }
    setCompareMode(enabled);
  };

  const handleApplyPreset = (preset: PresetConfig) => {
    const normalized = preset.configs.map((cfg) => ({
      ...createDefaultConfig(cfg.fontFamily),
      ...cfg,
    }));
    while (normalized.length < 4) {
      normalized.push({ ...createDefaultConfig() });
    }
    setCompareConfigs(normalized.slice(0, 4));
    setCompareMode(true);
    setActiveIndex(0);
  };

  const handleCellClick = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div style={appLayoutStyle}>
      <ControlPanel
        singleConfig={singleConfig}
        compareConfigs={compareConfigs}
        compareMode={compareMode}
        activeIndex={activeIndex}
        onSingleConfigChange={setSingleConfig}
        onCompareConfigChange={handleCompareConfigChange}
        onCompareModeChange={handleCompareModeChange}
        onActiveIndexChange={setActiveIndex}
        onApplyPreset={handleApplyPreset}
      />
      <PreviewArea
        singleConfig={singleConfig}
        compareConfigs={compareConfigs}
        compareMode={compareMode}
        activeIndex={activeIndex}
        onCellClick={handleCellClick}
      />
      <style>{globalStyles}</style>
    </div>
  );
};

const appLayoutStyle: React.CSSProperties = {
  display: 'flex',
  width: '100vw',
  height: '100vh',
  backgroundColor: '#ffffff',
  padding: 16,
  gap: 16,
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const globalStyles = `
  * {
    box-sizing: border-box;
  }
  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: #ffffff;
    color: #1F2937;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::selection {
    background-color: rgba(59, 130, 246, 0.2);
  }
  select:focus {
    border-color: #3B82F6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
  button:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background-color: #D1D5DB;
    border-radius: 999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: #9CA3AF;
  }
`;

export default App;
