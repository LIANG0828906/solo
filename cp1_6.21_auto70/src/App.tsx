import React, { useState, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import PreviewCanvas from './components/PreviewCanvas';
import { GradientConfig, calculateGradient } from './utils/gradientCalculator';
import { generateFullCssCode, downloadCssFile } from './utils/cssCodeGenerator';
import { presets } from './data/presets';
import './styles.css';

const defaultConfig: GradientConfig = {
  type: 'linear',
  angle: 135,
  colors: [
    { id: 'c1', color: '#667eea', position: 0 },
    { id: 'c2', color: '#764ba2', position: 100 },
  ],
};

const App: React.FC = () => {
  const [config, setConfig] = useState<GradientConfig>(defaultConfig);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleConfigChange = useCallback((newConfig: GradientConfig) => {
    setConfig(newConfig);
    setActivePreset(null);
  }, []);

  const handlePresetClick = useCallback((presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (!preset) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setConfig({ ...preset.gradientConfig });
      setActivePreset(presetName);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  }, []);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const closeModal = () => {
    setShowExportModal(false);
  };

  const handleDownload = () => {
    const code = generateFullCssCode(config, activePreset ?? undefined);
    downloadCssFile(code, activePreset ? `${activePreset}-gradient.css` : 'gradient.css');
  };

  const exportCode = generateFullCssCode(config, activePreset ?? undefined);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">CSS 渐变生成器</h1>
          <button className="export-btn" onClick={handleExport}>
            <span>导出 CSS</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <ControlPanel config={config} onChange={handleConfigChange} />
        <div className="canvas-container">
          <PreviewCanvas config={config} isTransitioning={isTransitioning} />
        </div>
      </main>

      <section className="presets-section">
        <h2 className="presets-title">预设模板</h2>
        <div className="presets-grid">
          {presets.map((preset) => (
            <button
              key={preset.name}
              className={`preset-card ${activePreset === preset.name ? 'active' : ''}`}
              onClick={() => handlePresetClick(preset.name)}
            >
              <div
                className="preset-preview"
                style={{ background: calculateGradient(preset.gradientConfig) }}
              />
              <span className="preset-name">{preset.name}</span>
            </button>
          ))}
        </div>
      </section>

      {showExportModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>导出 CSS 代码</h3>
              <button className="modal-close" onClick={closeModal} aria-label="关闭">
                ×
              </button>
            </div>
            <pre className="modal-code">
              <code>{exportCode}</code>
            </pre>
            <div className="modal-actions">
              <button className="download-btn" onClick={handleDownload}>
                下载 .css 文件
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
