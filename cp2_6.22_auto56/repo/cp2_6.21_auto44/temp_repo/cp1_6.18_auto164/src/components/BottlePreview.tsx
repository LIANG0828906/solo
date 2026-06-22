import React from 'react';
import { usePerfumeStore } from '../stores/perfumeStore';
import BottleRendererComponent from '../renderer/bottleRenderer';
import '../styles/BottlePreview.css';

const BottlePreview: React.FC = () => {
  const currentFormula = usePerfumeStore((s) => s.currentFormula);
  const dominant = currentFormula.length > 0
    ? [...currentFormula].sort((a, b) => b.ratio - a.ratio)[0].liquidColor
    : '#CCCCCC';

  return (
    <div className="bottle-preview-section">
      <div className="bottle-preview-header">
        <div className="bottle-preview-title">3D 香水瓶预览</div>
        <div
          className="bottle-preview-tag"
          style={{ backgroundColor: dominant + '40', color: '#333' }}
        >
          {currentFormula.length > 0 ? `${currentFormula.length} 种气味` : '空白配方'}
        </div>
      </div>

      <div className="bottle-preview-stage-wrap">
        <div className="bottle-preview-glow" style={{ background: `radial-gradient(circle, ${dominant}33 0%, transparent 70%)` }} />
        <BottleRendererComponent formula={currentFormula} scale={1} interactive />
      </div>

      <div className="bottle-preview-tip">点击瓶身可触发放光效果 ✨</div>
    </div>
  );
};

export default BottlePreview;
