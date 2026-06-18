import React, { useState } from 'react';
import { useGradientStore, generateGradientCSS, PreviewShape } from '../store/gradientStore';

export const GradientPreview: React.FC = () => {
  const {
    startColor,
    endColor,
    gradientType,
    angle,
    radius,
    radialShape,
    aspectRatio,
    shape,
    borderRadius,
    setShape,
    setBorderRadius,
  } = useGradientStore();

  const [copied, setCopied] = useState(false);

  const gradientCSS = generateGradientCSS({
    startColor,
    endColor,
    gradientType,
    angle,
    radius,
    radialShape,
    aspectRatio,
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

  const getPreviewStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      background: gradientCSS,
      transition: 'all 0.3s ease-out',
    };

    if (shape === 'circle') {
      return {
        ...baseStyle,
        width: '200px',
        height: '200px',
        borderRadius: '50%',
      };
    } else {
      return {
        ...baseStyle,
        width: '300px',
        height: '200px',
        borderRadius: `${borderRadius}px`,
      };
    }
  };

  return (
    <div className="gradient-preview-section">
      <div className="gradient-preview-header">
        <h3>渐变预览</h3>
      </div>

      <div className="preview-shape-controls">
        <span className="control-label">预览形状</span>
        <div className="type-toggle-group">
          <button
            className={`type-toggle-btn ${shape === 'rectangle' ? 'active' : ''}`}
            onClick={() => setShape('rectangle' as PreviewShape)}
          >
            矩形
          </button>
          <button
            className={`type-toggle-btn ${shape === 'circle' ? 'active' : ''}`}
            onClick={() => setShape('circle' as PreviewShape)}
          >
            圆形
          </button>
        </div>
      </div>

      {shape === 'rectangle' && (
        <div className="preview-border-radius-control">
          <div className="slider-control">
            <span className="control-label">圆角</span>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="range-slider"
            />
            <span className="slider-value">{borderRadius}px</span>
          </div>
        </div>
      )}

      <div className="gradient-preview-container">
        <div style={getPreviewStyle()} />
      </div>

      <div className="css-export-section">
        <div className="css-export-header">
          <span className="control-label">CSS 代码</span>
        </div>
        <div className="css-export-content">
          <div className="css-code-display">
            <code>{fullCSS}</code>
          </div>
          <button
            className={`copy-btn-inline ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradientPreview;
