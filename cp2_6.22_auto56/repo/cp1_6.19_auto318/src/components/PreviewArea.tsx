import React from 'react';
import { useThemeStore } from '../store';

const PreviewArea: React.FC = () => {
  const { theme } = useThemeStore();

  const cssVars: React.CSSProperties = {
    '--color-primary': theme.colorPrimary,
    '--color-bg': theme.bgColor,
    '--color-text': theme.textColor,
    '--spacing-padding-md': `${theme.paddingMd}px`,
    '--spacing-margin-md': `${theme.marginMd}px`,
    '--border-radius': `${theme.borderRadius}px`,
    '--font-size-md': `${theme.fontSizeMd}px`,
    '--shadow-blur': `${theme.shadowBlur}px`,
  } as React.CSSProperties;

  return (
    <div className="preview-area" style={cssVars}>
      <div className="preview-container">
        <div className="preview-content">
          <button className="preview-button">按钮</button>

          <div className="preview-card">
            <h3 className="card-title">卡片标题</h3>
            <p className="card-text">
              这是一段示例文本内容，用于展示卡片组件的样式效果。
              您可以通过左侧面板调整各种主题变量来实时预览效果。
            </p>
          </div>

          <input
            type="text"
            className="preview-input"
            placeholder="请输入内容..."
          />
        </div>
      </div>
      <style>{`
        .preview-area {
          flex: 1;
          height: 100%;
          background-color: #2c2c2c;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: auto;
        }

        .preview-container {
          width: 100%;
          min-width: 320px;
          max-width: 900px;
          background-color: var(--color-bg);
          border-radius: var(--border-radius);
          padding: var(--spacing-padding-md);
          box-shadow: 0 4px var(--shadow-blur) rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .preview-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-margin-md);
        }

        .preview-button {
          align-self: flex-start;
          padding: 12px 24px;
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: var(--font-size-md);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .preview-button:hover {
          filter: brightness(1.1);
        }

        .preview-button:active {
          transform: scale(0.98);
        }

        .preview-card {
          background-color: var(--color-bg);
          border-radius: var(--border-radius);
          padding: 24px;
          box-shadow: 0 2px var(--shadow-blur) rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }

        .card-title {
          font-size: calc(var(--font-size-md) + 4px);
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 12px;
          transition: all 0.3s ease;
        }

        .card-text {
          font-size: var(--font-size-md);
          color: var(--color-text);
          line-height: 1.6;
          opacity: 0.85;
          transition: all 0.3s ease;
        }

        .preview-input {
          width: 100%;
          padding: var(--spacing-padding-md);
          border: 2px solid #d9d9d9;
          border-radius: var(--border-radius);
          font-size: var(--font-size-md);
          color: var(--color-text);
          background-color: var(--color-bg);
          outline: none;
          transition: all 0.3s ease;
        }

        .preview-input::placeholder {
          color: #999;
        }

        .preview-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
        }
      `}</style>
    </div>
  );
};

export default PreviewArea;
