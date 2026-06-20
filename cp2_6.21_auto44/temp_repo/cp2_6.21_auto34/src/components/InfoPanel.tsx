import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import './InfoPanel.css';

export function InfoPanel() {
  const { panelData, closePanel } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (panelData) {
      setIsAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [panelData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePanel]);

  if (!isAnimating && !panelData) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePanel();
    }
  };

  const verticalText = (text: string) => {
    return text.split('').map((char, i) => (
      <span key={i} style={{ display: 'block' }}>
        {char}
      </span>
    ));
  };

  return (
    <div
      className={`info-panel-overlay ${isVisible ? 'visible' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={`info-panel-content ${isVisible ? 'visible' : ''}`}>
        <div
          className="info-panel-close"
          onClick={closePanel}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
          }}
        >
          ✕
        </div>

        <div className="info-panel-body">
          <div className="info-panel-title">
            {panelData && verticalText(panelData.title)}
          </div>

          <div className="info-panel-details">
            {panelData?.azimuth !== undefined && (
              <div className="info-panel-detail">
                <span className="info-panel-label">方位角：</span>
                <span className="info-panel-value">{panelData.azimuth.toFixed(2)}°</span>
              </div>
            )}
            {panelData?.elevation !== undefined && (
              <div className="info-panel-detail">
                <span className="info-panel-label">仰角：</span>
                <span className="info-panel-value">{panelData.elevation.toFixed(2)}°</span>
              </div>
            )}

            <div className="info-panel-divider" />

            <div className="info-panel-description">
              {panelData?.description}
            </div>
          </div>
        </div>

        <div className="info-panel-bottom-line" />
      </div>
    </div>
  );
}
