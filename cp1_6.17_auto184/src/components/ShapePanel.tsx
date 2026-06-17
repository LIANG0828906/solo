import React from 'react';
import { useArtworkStore } from '@/store/artworkStore';
import { ShapeType, TextureType } from '@/types';
import './ShapePanel.css';

const SHAPES: { type: ShapeType; label: string }[] = [
  { type: 'circle', label: '圆形' },
  { type: 'triangle', label: '三角形' },
  { type: 'star', label: '星形' },
  { type: 'diamond', label: '钻石形' },
];

const TEXTURES: { type: TextureType; label: string }[] = [
  { type: 'none', label: '无纹理' },
  { type: 'noise', label: '噪点' },
  { type: 'stripes', label: '条纹' },
  { type: 'waves', label: '波浪' },
  { type: 'dots', label: '点阵' },
];

const ShapePanel: React.FC = () => {
  const selectedShapeType = useArtworkStore((state) => state.selectedShapeType);
  const selectedTexture = useArtworkStore((state) => state.selectedTexture);
  const setSelectedShapeType = useArtworkStore((state) => state.setSelectedShapeType);
  const setSelectedTexture = useArtworkStore((state) => state.setSelectedTexture);
  const gradientMode = useArtworkStore((state) => state.gradientMode);
  const setGradientMode = useArtworkStore((state) => state.setGradientMode);

  const renderShapeIcon = (type: ShapeType, size: number = 40) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const center = size / 2;
    const shapeSize = size * 0.7;

    ctx.fillStyle = '#EDF2F4';

    switch (type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(center, center, shapeSize / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'triangle':
        const h = shapeSize * 0.866;
        ctx.beginPath();
        ctx.moveTo(center, center - h / 2);
        ctx.lineTo(center - shapeSize / 2, center + h / 2);
        ctx.lineTo(center + shapeSize / 2, center + h / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'star':
        const outerR = shapeSize / 2;
        const innerR = shapeSize / 4;
        const spikes = 5;
        const step = Math.PI / spikes;
        let rot = -Math.PI / 2;

        ctx.beginPath();
        ctx.moveTo(
          center + Math.cos(rot) * outerR,
          center + Math.sin(rot) * outerR
        );

        for (let i = 0; i < spikes; i++) {
          rot += step;
          ctx.lineTo(
            center + Math.cos(rot) * innerR,
            center + Math.sin(rot) * innerR
          );
          rot += step;
          ctx.lineTo(
            center + Math.cos(rot) * outerR,
            center + Math.sin(rot) * outerR
          );
        }
        ctx.closePath();
        ctx.fill();
        break;
      case 'diamond':
        const half = shapeSize / 2;
        ctx.beginPath();
        ctx.moveTo(center, center - half);
        ctx.lineTo(center + half / 1.5, center);
        ctx.lineTo(center, center + half);
        ctx.lineTo(center - half / 1.5, center);
        ctx.closePath();
        ctx.fill();
        break;
    }

    return canvas.toDataURL();
  };

  const renderTexturePreview = (type: TextureType, size: number = 50) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const center = size / 2;

    ctx.fillStyle = '#3D3D6B';
    ctx.fillRect(0, 0, size, size);

    if (type === 'none') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, size - 2, size - 2);
      ctx.fillStyle = '#EDF2F4';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('无', center, center + 4);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

      switch (type) {
        case 'noise':
          for (let i = 0; i < 80; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.fillRect(x, y, 2, 2);
          }
          break;
        case 'stripes':
          for (let i = 0; i < size; i += 6) {
            ctx.fillRect(0, i, size, 3);
          }
          break;
        case 'waves':
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = 0; x <= size; x++) {
            const y = center + Math.sin((x / size) * Math.PI * 3) * 10;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          break;
        case 'dots':
          for (let x = 4; x < size; x += 8) {
            for (let y = 4; y < size; y += 8) {
              ctx.beginPath();
              ctx.arc(x, y, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;
      }
    }

    return canvas.toDataURL();
  };

  return (
    <div className="shape-panel">
      <h3 className="panel-title">形状选择</h3>
      
      <div className="shape-grid">
        {SHAPES.map((shape) => (
          <button
            key={shape.type}
            className={`shape-item ${selectedShapeType === shape.type ? 'selected' : ''}`}
            onClick={() => setSelectedShapeType(shape.type)}
            title={shape.label}
          >
            <img
              src={renderShapeIcon(shape.type) || ''}
              alt={shape.label}
              className="shape-icon"
            />
            <span className="shape-label">{shape.label}</span>
          </button>
        ))}
      </div>

      <div className="section-divider" />

      <h3 className="panel-title">纹理效果</h3>
      
      <div className="texture-grid">
        {TEXTURES.map((texture) => (
          <button
            key={texture.type}
            className={`texture-item ${selectedTexture === texture.type ? 'selected' : ''}`}
            onClick={() => setSelectedTexture(texture.type)}
            title={texture.label}
          >
            <img
              src={renderTexturePreview(texture.type) || ''}
              alt={texture.label}
              className="texture-preview"
            />
            <span className="texture-label">{texture.label}</span>
          </button>
        ))}
      </div>

      <div className="section-divider" />

      <button
        className={`gradient-mode-btn ${gradientMode ? 'active' : ''}`}
        onClick={() => setGradientMode(!gradientMode)}
      >
        <span className="gradient-icon">↔</span>
        {gradientMode ? '取消渐变模式' : '添加渐变连接'}
      </button>

      {gradientMode && (
        <p className="gradient-hint">
          点击两个形状创建渐变连接线
        </p>
      )}

      <div className="tip-section">
        <p className="tip-title">使用提示</p>
        <ul className="tip-list">
          <li>点击画布放置形状</li>
          <li>拖拽移动形状位置</li>
          <li>选中形状后可改颜色</li>
        </ul>
      </div>
    </div>
  );
};

export default ShapePanel;
