import React, { useState } from 'react';
import { useThemeStore } from '../store';
import { ThemeControlConfig, ThemeVariables } from '../types';

const controlConfigs: ThemeControlConfig[] = [
  { key: 'colorPrimary', label: '主色', type: 'color' },
  { key: 'bgColor', label: '背景色', type: 'color' },
  { key: 'textColor', label: '文字色', type: 'color' },
  { key: 'paddingMd', label: '内边距', type: 'number', unit: 'px', min: 0, max: 50, step: 1 },
  { key: 'marginMd', label: '外边距', type: 'number', unit: 'px', min: 0, max: 50, step: 1 },
  { key: 'borderRadius', label: '圆角半径', type: 'number', unit: 'px', min: 0, max: 50, step: 1 },
  { key: 'fontSizeMd', label: '字体大小', type: 'number', unit: 'px', min: 0, max: 50, step: 1 },
  { key: 'shadowBlur', label: '阴影模糊', type: 'number', unit: 'px', min: 0, max: 50, step: 1 },
];

const cssVarMap: Record<keyof ThemeVariables, string> = {
  colorPrimary: '--color-primary',
  bgColor: '--color-bg',
  textColor: '--color-text',
  paddingMd: '--spacing-padding-md',
  marginMd: '--spacing-margin-md',
  borderRadius: '--border-radius',
  fontSizeMd: '--font-size-md',
  shadowBlur: '--shadow-blur',
};

const EditorPanel: React.FC = () => {
  const { theme, updateTheme, setTheme } = useThemeStore();
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleExport = async () => {
    const cssVars = Object.entries(theme)
      .map(([key, value]) => {
        const cssVar = cssVarMap[key as keyof ThemeVariables];
        const suffix = controlConfigs.find((c) => c.key === key)?.type === 'number' ? 'px' : '';
        return `  ${cssVar}: ${value}${suffix};`;
      })
      .join('\n');
    const styleTag = `<style>\n:root {\n${cssVars}\n}\n</style>`;
    try {
      await navigator.clipboard.writeText(styleTag);
      alert('主题已导出到剪贴板！');
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  const handleImport = () => {
    try {
      const parsed: Partial<ThemeVariables> = {};
      const lines = importText.split('\n');
      for (const line of lines) {
        const match = line.match(/--[\w-]+:\s*([^;]+);/);
        if (match) {
          const value = match[1].trim();
          const cssVarKey = Object.keys(cssVarMap).find(
            (k) => cssVarMap[k as keyof ThemeVariables] === line.match(/(--[\w-]+):/)?.[1]
          ) as keyof ThemeVariables | undefined;
          if (cssVarKey) {
            const config = controlConfigs.find((c) => c.key === cssVarKey);
            if (config?.type === 'number') {
              const num = parseFloat(value.replace('px', ''));
              if (!isNaN(num)) {
                parsed[cssVarKey] = num;
              }
            } else {
              parsed[cssVarKey] = value;
            }
          }
        }
      }
      if (Object.keys(parsed).length > 0) {
        setTheme(parsed);
        alert('主题导入成功！');
        setShowImport(false);
        setImportText('');
      } else {
        alert('未找到有效的CSS变量');
      }
    } catch {
      alert('导入失败，请检查格式');
    }
  };

  const renderControl = (config: ThemeControlConfig) => {
    const value = theme[config.key];

    if (config.type === 'color') {
      return (
        <div className="control-row" key={config.key}>
          <label className="control-label">{config.label}</label>
          <div className="control-inputs color-inputs">
            <input
              type="color"
              value={value as string}
              onChange={(e) => updateTheme(config.key, e.target.value)}
              className="color-picker"
            />
            <div
              className="color-preview"
              style={{ backgroundColor: value as string }}
            />
            <input
              type="text"
              value={value as string}
              onChange={(e) => updateTheme(config.key, e.target.value)}
              className="text-input"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="control-row" key={config.key}>
        <label className="control-label">
          {config.label} ({value}{config.unit})
        </label>
        <div className="control-inputs">
          <input
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={value as number}
            onChange={(e) => updateTheme(config.key, parseFloat(e.target.value))}
            className="slider"
          />
          <input
            type="number"
            min={config.min}
            max={config.max}
            step={config.step}
            value={value as number}
            onChange={(e) => updateTheme(config.key, parseFloat(e.target.value) || 0)}
            className="number-input"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h2>主题变量编辑</h2>
      </div>
      <div className="controls-container">
        {controlConfigs.map(renderControl)}
      </div>
      <div className="action-buttons">
        <button className="action-btn" onClick={handleExport}>
          导出主题
        </button>
        <button
          className="action-btn"
          style={{ marginLeft: '12px' }}
          onClick={() => setShowImport(!showImport)}
        >
          {showImport ? '取消' : '导入主题'}
        </button>
      </div>
      {showImport && (
        <div className="import-section">
          <textarea
            className="import-textarea"
            placeholder="粘贴包含CSS变量的style标签内容..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
          />
          <button className="action-btn" onClick={handleImport}>
            确认导入
          </button>
        </div>
      )}
      <style>{`
        .editor-panel {
          width: 35%;
          height: 100%;
          background-color: #f5f5f5;
          border-radius: 4px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.3s ease-in-out;
          overflow-y: auto;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .editor-header {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e0e0e0;
        }

        .editor-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .controls-container {
          flex: 1;
          overflow-y: auto;
        }

        .control-row {
          padding: 14px 0;
          border-bottom: 1px solid #ddd;
          transition: background-color 0.2s ease;
        }

        .control-row:hover {
          background-color: #e0e0e0;
        }

        .control-row:last-of-type {
          border-bottom: none;
        }

        .control-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #555;
          margin-bottom: 10px;
        }

        .control-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .color-inputs {
          gap: 8px;
        }

        .color-picker {
          width: 40px;
          height: 32px;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          padding: 0;
          background: none;
          transition: all 0.2s ease;
        }

        .color-picker:hover {
          border-color: #999;
        }

        .color-preview {
          width: 30px;
          height: 30px;
          border-radius: 4px;
          border: 1px solid #ccc;
          transition: all 0.2s ease;
        }

        .text-input {
          flex: 1;
          height: 32px;
          padding: 0 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 13px;
          font-family: monospace;
          transition: all 0.2s ease;
        }

        .text-input:focus {
          outline: none;
          border-color: ${theme.colorPrimary};
          box-shadow: 0 0 0 2px ${theme.colorPrimary}22;
        }

        .slider {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #ddd;
          outline: none;
          cursor: pointer;
          accent-color: ${theme.colorPrimary};
        }

        .number-input {
          width: 70px;
          height: 32px;
          padding: 0 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 13px;
          text-align: center;
          transition: all 0.2s ease;
        }

        .number-input:focus {
          outline: none;
          border-color: ${theme.colorPrimary};
          box-shadow: 0 0 0 2px ${theme.colorPrimary}22;
        }

        .action-buttons {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #ddd;
          display: flex;
          align-items: center;
        }

        .action-btn {
          padding: 10px 20px;
          background-color: ${theme.colorPrimary};
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          filter: brightness(1.1);
        }

        .action-btn:active {
          transform: scale(0.95);
        }

        .import-section {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .import-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          resize: vertical;
          transition: all 0.2s ease;
        }

        .import-textarea:focus {
          outline: none;
          border-color: ${theme.colorPrimary};
          box-shadow: 0 0 0 2px ${theme.colorPrimary}22;
        }
      `}</style>
    </div>
  );
};

export default EditorPanel;
