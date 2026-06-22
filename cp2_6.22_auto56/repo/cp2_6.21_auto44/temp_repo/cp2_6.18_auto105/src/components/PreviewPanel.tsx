import React from 'react';
import { usePaletteStore } from '../store';
import { Mode } from '../utils/colorUtils';

export const PreviewPanel: React.FC = () => {
  const { currentMode, setMode, getCurrentScheme, palette } = usePaletteStore();
  const scheme = getCurrentScheme();

  const modes: { key: Mode; label: string }[] = [
    { key: 'light', label: '浅色模式' },
    { key: 'dark', label: '深色模式' },
    { key: 'glass', label: '毛玻璃模式' },
  ];

  const isGlassMode = currentMode === 'glass';

  return (
    <div
      className="preview-panel"
      style={{
        backgroundColor: isGlassMode ? 'transparent' : scheme.background,
        color: scheme.text,
      }}
    >
      {isGlassMode && (
        <>
          <div
            className="glass-bg"
            style={{
              background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[2]} 40%, ${palette[4]} 100%)`,
            }}
          />
          <div
            className="glass-blob glass-blob-1"
            style={{
              backgroundColor: palette[1],
            }}
          />
          <div
            className="glass-blob glass-blob-2"
            style={{
              backgroundColor: palette[3],
            }}
          />
          <div
            className="glass-blur-overlay"
            style={{
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
            }}
          />
        </>
      )}

      <div className="tabs-container">
        {modes.map((mode) => (
          <button
            key={mode.key}
            className={`tab-btn ${currentMode === mode.key ? 'active' : ''}`}
            onClick={() => setMode(mode.key)}
            style={{
              color: currentMode === mode.key ? scheme.primary : scheme.text,
              borderBottomColor:
                currentMode === mode.key ? scheme.primary : 'transparent',
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="preview-content">
        <div
          className="preview-card"
          style={{
            backgroundColor: scheme.cardBg,
            border: isGlassMode ? `1px solid ${scheme.border}` : 'none',
            backdropFilter: isGlassMode ? 'blur(15px)' : 'none',
            WebkitBackdropFilter: isGlassMode ? 'blur(15px)' : 'none',
            borderRadius: isGlassMode ? '16px' : '12px',
          }}
        >
          <h2 className="card-title" style={{ color: scheme.text }}>
            品牌配色预览
          </h2>
          <p className="card-subtitle" style={{ color: scheme.secondary }}>
            基于您的主色调生成的UI组件方案
          </p>

          <div className="button-group">
            <button
              className="primary-btn"
              style={{
                backgroundColor: scheme.primary,
                color: '#FFFFFF',
                boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.2), 
                            0 4px 8px rgba(0, 0, 0, 0.15)`,
              }}
            >
              主要按钮
            </button>
            <button
              className="secondary-btn"
              style={{
                backgroundColor: scheme.inputBg,
                color: scheme.primary,
                border: `2px solid ${scheme.primary}`,
              }}
            >
              次要按钮
            </button>
          </div>

          <div className="input-group">
            <label className="input-label" style={{ color: scheme.text }}>
              输入框示例
            </label>
            <input
              type="text"
              placeholder="请输入内容..."
              className="preview-input"
              style={{
                backgroundColor: scheme.inputBg,
                color: scheme.text,
                border: `1px solid ${scheme.border}`,
              }}
            />
          </div>

          <div className="color-chips">
            {palette.map((color, index) => (
              <div
                key={index}
                className="color-chip"
                style={{ backgroundColor: color }}
                title={`色阶 ${index + 1}: ${color}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .preview-panel {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: background-color 0.4s ease, color 0.4s ease;
          overflow: hidden;
        }
        .glass-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          transition: background 0.4s ease;
        }
        .glass-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.7;
          z-index: 0;
          transition: background-color 0.4s ease;
        }
        .glass-blob-1 {
          width: 300px;
          height: 300px;
          top: 10%;
          left: 10%;
        }
        .glass-blob-2 {
          width: 400px;
          height: 400px;
          bottom: 10%;
          right: 10%;
        }
        .glass-blur-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
        }
        .tabs-container {
          display: flex;
          gap: 0;
          padding: 0 24px;
          z-index: 1;
        }
        .tab-btn {
          padding: 16px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.4s ease, border-color 0.4s ease;
          position: relative;
        }
        .tab-btn:hover {
          opacity: 0.8;
        }
        .tab-btn.active {
          font-weight: 600;
        }
        .preview-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          z-index: 1;
        }
        .preview-card {
          width: 100%;
          max-width: 480px;
          padding: 32px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          transition: background-color 0.4s ease, border-color 0.4s ease,
            box-shadow 0.4s ease, backdrop-filter 0.4s ease;
        }
        .card-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
          transition: color 0.4s ease;
        }
        .card-subtitle {
          font-size: 14px;
          margin: 0 0 28px 0;
          opacity: 0.7;
          transition: color 0.4s ease;
        }
        .button-group {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
        }
        .primary-btn {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .primary-btn:hover {
          transform: translateY(-1px);
        }
        .primary-btn:active {
          transform: translateY(1px);
        }
        .secondary-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        .secondary-btn:hover {
          transform: translateY(-1px);
        }
        .input-group {
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-label {
          font-size: 13px;
          font-weight: 500;
          transition: color 0.4s ease;
        }
        .preview-input {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: background-color 0.4s ease, color 0.4s ease,
            border-color 0.4s ease;
        }
        .preview-input::placeholder {
          opacity: 0.4;
        }
        .preview-input:focus {
          outline: none;
        }
        .color-chips {
          display: flex;
          gap: 8px;
        }
        .color-chip {
          width: 100%;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .color-chip:hover {
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .preview-content {
            padding: 20px;
          }
          .preview-card {
            padding: 24px;
          }
          .card-title {
            font-size: 20px;
          }
          .button-group {
            flex-direction: column;
          }
          .primary-btn,
          .secondary-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
