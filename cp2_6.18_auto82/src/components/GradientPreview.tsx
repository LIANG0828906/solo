import React from 'react';
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
    previewShape,
    borderRadius,
    setPreviewShape,
    setBorderRadius,
  } = useGradientStore();

  const gradientCSS = generateGradientCSS({
    startColor,
    endColor,
    gradientType,
    angle,
    radius,
    radialShape,
    aspectRatio,
  });

  const handleToggleShape = () => {
    const next: PreviewShape = previewShape === 'rectangle' ? 'circle' : 'rectangle';
    setPreviewShape(next);
  };

  const handleToggleRadius = () => {
    setBorderRadius(borderRadius === 16 ? 0 : 16);
  };

  const getPreviewStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      background: gradientCSS,
      transition: 'all 0.3s ease-out',
    };

    if (previewShape === 'circle') {
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
        <div className="preview-controls">
          <button
            className={`preview-toggle-btn ${previewShape === 'rectangle' ? 'active' : ''}`}
            onClick={handleToggleShape}
          >
            {previewShape === 'rectangle' ? '矩形' : '切换为矩形'}
          </button>
          <button
            className={`preview-toggle-btn ${previewShape === 'circle' ? 'active' : ''}`}
            onClick={handleToggleShape}
          >
            {previewShape === 'circle' ? '圆形' : '切换为圆形'}
          </button>
          {previewShape === 'rectangle' && (
            <button
              className="preview-toggle-btn"
              onClick={handleToggleRadius}
            >
              圆角: {borderRadius}px
            </button>
          )}
        </div>
      </div>
      <div className="gradient-preview-container">
        <div style={getPreviewStyle()} />
      </div>
    </div>
  );
};

export default GradientPreview;
