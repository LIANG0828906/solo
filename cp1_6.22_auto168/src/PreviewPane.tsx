import { memo, useMemo, useRef, useState, useEffect } from 'react';
import type { Theme } from './themes';
import { presetThemes, exportThemeToJSON } from './themes';
import { highlight, clearCache } from './highlighter';

interface PreviewPaneProps {
  code: string;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const PreviewPane = memo(function PreviewPane({ code, theme, onThemeChange }: PreviewPaneProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const highlightedHTML = useMemo(() => {
    return highlight(code, theme);
  }, [code, theme]);

  const exportedJSON = useMemo(() => {
    return exportThemeToJSON(theme);
  }, [theme]);

  useEffect(() => {
    clearCache();
  }, [theme]);

  const handleThemeSelect = (presetTheme: Theme) => {
    onThemeChange(presetTheme);
  };

  const handleColorChange = (key: keyof Theme, value: string) => {
    onThemeChange({
      ...theme,
      [key]: value,
      name: theme.name.includes('(自定义)') ? theme.name : `${theme.name} (自定义)`
    });
  };

  const handleExport = () => {
    setIsModalOpen(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedJSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const colorControls = [
    { key: 'keyword' as const, label: '关键字' },
    { key: 'string' as const, label: '字符串' },
    { key: 'comment' as const, label: '注释' },
    { key: 'background' as const, label: '背景色' }
  ];

  return (
    <div className="preview-pane">
      <div className="theme-thumbnails">
        {presetThemes.map((preset) => (
          <button
            key={preset.name}
            className={`theme-thumbnail ${theme.name === preset.name ? 'active' : ''}`}
            style={{
              backgroundColor: preset.background,
              color: preset.keyword
            }}
            onClick={() => handleThemeSelect(preset)}
            title={preset.name}
            aria-label={`切换到${preset.name}主题`}
          >
            <span className="thumbnail-keyword">fn</span>
            <span className="thumbnail-string">"str"</span>
          </button>
        ))}
      </div>

      <div
        className="code-preview"
        style={{
          backgroundColor: theme.background,
          color: theme.text,
          transition: 'background-color 0.3s ease, color 0.3s ease'
        }}
      >
        <pre>
          <code dangerouslySetInnerHTML={{ __html: highlightedHTML }} />
        </pre>
      </div>

      <div className="custom-panel">
        <div className="panel-header">
          <h3 className="panel-title">自定义配色</h3>
          <button className="export-btn" onClick={handleExport}>
            导出主题
          </button>
        </div>
        <div className="color-controls">
          {colorControls.map(({ key, label }) => (
            <div className="color-control" key={key}>
              <label className="color-label">{label}</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  className="color-picker"
                  value={theme[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  title={`选择${label}颜色`}
                />
                <span className="color-value">{theme[key]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">导出主题配置</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <pre className="json-output">
                <code>{exportedJSON}</code>
              </pre>
            </div>
            <div className="modal-footer">
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? '✓ 已复制' : '复制到剪贴板'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PreviewPane;
