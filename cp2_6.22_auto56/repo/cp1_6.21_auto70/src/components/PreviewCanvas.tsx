import React, { useState } from 'react';
import { GradientConfig, calculateGradient } from '../utils/gradientCalculator';
import { generateSimpleCssCode } from '../utils/cssCodeGenerator';

interface PreviewCanvasProps {
  config: GradientConfig;
  isTransitioning?: boolean;
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ config, isTransitioning }) => {
  const [copied, setCopied] = useState(false);
  const gradient = calculateGradient(config);
  const cssCode = generateSimpleCssCode(config);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 600);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = cssCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 600);
    }
  };

  return (
    <div className="preview-canvas-wrapper">
      <div
        className={`preview-canvas ${isTransitioning ? 'fading' : ''}`}
        style={{ background: gradient }}
      />
      <div className="code-display-wrapper">
        <div className="code-display" onClick={handleCopy}>
          <code>{cssCode}</code>
          <div className={`copy-indicator ${copied ? 'show' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div className="code-hint">点击代码复制到剪贴板</div>
      </div>
    </div>
  );
};

export default PreviewCanvas;
