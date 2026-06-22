import React from 'react';
import { useGradientStore, generateFullCSS } from '../store/gradientStore';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, showToast }) => {
  const state = useGradientStore();

  const { full } = generateFullCSS({
    startColor: state.startColor,
    endColor: state.endColor,
    gradientType: state.gradientType,
    angle: state.angle,
    radius: state.radius,
    radialShape: state.radialShape,
    aspectRatio: state.aspectRatio,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(full);
      showToast('已复制到剪贴板');
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
            <pre><code>{full}</code></pre>
          </div>
        </div>
        <div className="modal-footer">
          <button className="copy-btn" onClick={handleCopy}>
            复制代码
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
