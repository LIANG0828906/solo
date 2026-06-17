import React, { useState, useCallback } from 'react';
import BrewForm from '../components/BrewForm';
import WaterPourSVG from '../components/WaterPourSVG';
import FlavorModal from '../components/FlavorModal';
import { useAppStore } from '../store/useAppStore';

const BrewingPage: React.FC = () => {
  const { brewForm, setFlavorModalOpen } = useAppStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);

  const handleFormSubmit = () => {
    setCurrentStage(0);
    setIsAnimating(true);
  };

  const handleAnimationComplete = useCallback(() => {
    if (currentStage < brewForm.pourStages.length - 1) {
      setCurrentStage(s => s + 1);
      setTimeout(() => setIsAnimating(true), 400);
      setIsAnimating(false);
    } else {
      setIsAnimating(false);
      setTimeout(() => {
        setFlavorModalOpen(true);
      }, 500);
    }
  }, [currentStage, brewForm.pourStages.length, setFlavorModalOpen]);

  return (
    <div className="brewing-page">
      <div className="brewing-sidebar">
        <div className="page-header">
          <div className="page-icon">☕</div>
          <div>
            <h1 className="page-title">冲煮记录</h1>
            <p className="page-subtitle">记录每一次完美冲煮</p>
          </div>
        </div>
        <BrewForm onSubmit={handleFormSubmit} />
      </div>

      <div className="brewing-preview">
        <div className="preview-header">
          <h2 className="preview-title">注水预览</h2>
          <div className="stage-indicators">
            {brewForm.pourStages.map((_, i) => (
              <span
                key={i}
                className={`stage-dot ${i < currentStage ? 'done' : ''} ${i === currentStage ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="svg-container">
          <WaterPourSVG
            pourStages={brewForm.pourStages}
            currentStage={currentStage}
            isAnimating={isAnimating}
            onAnimationComplete={handleAnimationComplete}
          />
        </div>

        <div className="params-summary">
          <div className="param-summary-item">
            <span className="summary-label">豆子</span>
            <span className="summary-value">{brewForm.beanName || '--'}</span>
          </div>
          <div className="param-summary-item">
            <span className="summary-label">产地</span>
            <span className="summary-value">{brewForm.origin || '--'}</span>
          </div>
          <div className="param-summary-item">
            <span className="summary-label">烘焙</span>
            <span className="summary-value">{brewForm.roastLevel ? `${brewForm.roastLevel}焙` : '--'}</span>
          </div>
          <div className="param-summary-item">
            <span className="summary-label">研磨</span>
            <span className="summary-value">{brewForm.grindSize}</span>
          </div>
          <div className="param-summary-item">
            <span className="summary-label">水温</span>
            <span className="summary-value">{brewForm.waterTemp}°C</span>
          </div>
          <div className="param-summary-item">
            <span className="summary-label">粉水比</span>
            <span className="summary-value">{brewForm.ratio}</span>
          </div>
        </div>
      </div>

      <FlavorModal />
    </div>
  );
};

export default BrewingPage;
