import { useMemo, useCallback, useState } from 'react';
import { saveAs } from 'file-saver';
import type { ColorGroup, ExportFormat } from '../types';
import { generateCssTokens, generateJsonTokens } from '../utils/colorUtils';

interface TokenPanelProps {
  palette: ColorGroup | null;
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  onCopy: (text: string) => void;
}

export default function TokenPanel({ palette, format, onFormatChange, onCopy }: TokenPanelProps) {
  const [copyFlash, setCopyFlash] = useState(false);

  const tokenText = useMemo(() => {
    if (!palette) return '';
    return format === 'css' ? generateCssTokens(palette) : generateJsonTokens(palette);
  }, [palette, format]);

  const handleCopyAll = useCallback(async () => {
    if (!tokenText) return;
    try {
      await navigator.clipboard.writeText(tokenText);
      setCopyFlash(true);
      onCopy(format === 'css' ? 'CSS Token' : 'JSON Token');
      setTimeout(() => setCopyFlash(false), 600);
    } catch (e) {
      console.error('复制失败:', e);
    }
  }, [tokenText, format, onCopy]);

  const handleExport = useCallback(() => {
    if (!tokenText || !palette) return;
    const timestamp = Date.now();
    if (format === 'css') {
      const blob = new Blob([tokenText], { type: 'text/css;charset=utf-8' });
      saveAs(blob, `md3-colors-${timestamp}.css`);
    } else {
      const blob = new Blob([tokenText], { type: 'application/json;charset=utf-8' });
      saveAs(blob, `md3-colors-${timestamp}.json`);
    }
  }, [tokenText, format, palette]);

  return (
    <div className="token-panel">
      <div className="panel-header">
        <h2 className="panel-title">设计 Token</h2>
        <div className="format-toggle" role="radiogroup" aria-label="导出格式">
          <label className={`radio-btn ${format === 'css' ? 'active' : ''}`}>
            <input
              type="radio"
              name="format"
              value="css"
              checked={format === 'css'}
              onChange={() => onFormatChange('css')}
            />
            <span>CSS</span>
          </label>
          <label className={`radio-btn ${format === 'json' ? 'active' : ''}`}>
            <input
              type="radio"
              name="format"
              value="json"
              checked={format === 'json'}
              onChange={() => onFormatChange('json')}
            />
            <span>JSON</span>
          </label>
        </div>
      </div>

      <pre className="token-code">
        <code>{tokenText || '请输入主色以生成 Token...'}</code>
      </pre>

      <div className="panel-actions">
        <button
          type="button"
          className={`action-btn copy-btn ${copyFlash ? 'flash' : ''}`}
          onClick={handleCopyAll}
          disabled={!tokenText}
        >
          {copyFlash ? '✓ 已复制' : '复制 Token'}
        </button>
        <button
          type="button"
          className="action-btn export-btn"
          onClick={handleExport}
          disabled={!tokenText}
        >
          导出文件
        </button>
      </div>
    </div>
  );
}
