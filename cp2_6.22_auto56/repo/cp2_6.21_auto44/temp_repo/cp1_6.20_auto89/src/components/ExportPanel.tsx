import React, { useState } from 'react';
import { Keyframe, EasingType, CubicBezierParams } from '../types';
import { generateKeyframesCSS, generateHTMLSnippet } from '../utils/cssGenerator';

interface ExportPanelProps {
  keyframes: Keyframe[];
  easingType: EasingType;
  bezierParams: CubicBezierParams;
  duration: number;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  keyframes,
  easingType,
  bezierParams,
  duration,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState<'css' | 'html'>('css');

  const cssCode = generateKeyframesCSS(
    keyframes,
    'customAnimation',
    duration,
    easingType,
    bezierParams
  );

  const htmlCode = generateHTMLSnippet(cssCode, 'customAnimation');

  const displayCode = exportFormat === 'css' ? cssCode : htmlCode;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="export-panel">
      <div className="panel-header" style={{ padding: '0 0 16px 0', border: 'none' }}>
        <span className="panel-title">导出代码</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className={`btn ${exportFormat === 'css' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '12px', minHeight: '32px' }}
            onClick={() => setExportFormat('css')}
          >
            CSS
          </button>
          <button
            className={`btn ${exportFormat === 'html' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '12px', minHeight: '32px' }}
            onClick={() => setExportFormat('html')}
          >
            HTML
          </button>
        </div>
      </div>

      <pre className="code-block">{displayCode}</pre>

      <div className="export-actions">
        <button className="btn btn-primary" onClick={handleCopy} style={{ flex: 1 }}>
          📋 复制代码
        </button>
      </div>

      {showSuccess && <div className="copy-success">✓ 已复制到剪贴板</div>}
    </div>
  );
};
