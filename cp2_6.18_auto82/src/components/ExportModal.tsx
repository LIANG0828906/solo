import React, { useState } from 'react';
import { useGradientStore, generateGradientCSS } from '../store/gradientStore';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const state = useGradientStore();

  const gradientCSS = generateGradientCSS({
    startColor: state.startColor,
    endColor: state.endColor,
    gradientType: state.gradientType,
    angle: state.angle,
    radius: state.radius,
    radialShape: state.radialShape,
    aspectRatio: state.aspectRatio,
  });

  const fullCSS = `background: ${gradientCSS};`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullCSS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>导出CSS代码</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="css-code-block">
            <pre><code>{fullCSS}</code></pre>
          </div>
        </div>
        <div className="modal-footer">
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? '已复制' : '复制代码'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
