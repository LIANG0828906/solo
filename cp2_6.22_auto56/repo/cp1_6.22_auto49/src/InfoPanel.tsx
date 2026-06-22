import { useState, useEffect } from 'react';
import { CelestialBodyData } from './CelestialBody';

interface InfoPanelProps {
  body: CelestialBodyData | null;
  starBody: CelestialBodyData | null;
  isMobile: boolean;
  onClose: () => void;
}

export function InfoPanel({ body, starBody, isMobile, onClose }: InfoPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (body) {
      setIsClosing(false);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [body]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!body && !isClosing) return null;

  const calculateSpeed = (): number => {
    if (!body) return 0;
    const v = body.velocity;
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  };

  const calculateDistance = (): number => {
    if (!body || !starBody) return 0;
    const dx = body.position.x - starBody.position.x;
    const dy = body.position.y - starBody.position.y;
    const dz = body.position.z - starBody.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const calculateOrbitalPeriod = (): string => {
    if (!body || !starBody || body.type === 'star') return 'N/A';
    
    const G = 50;
    const distance = calculateDistance();
    const totalMass = starBody.mass + body.mass;
    
    if (totalMass <= 0 || distance <= 0) return 'N/A';
    
    const period = 2 * Math.PI * Math.sqrt(Math.pow(distance, 3) / (G * totalMass));
    
    if (period < 60) {
      return `${period.toFixed(1)} 秒`;
    } else if (period < 3600) {
      return `${(period / 60).toFixed(1)} 分钟`;
    } else {
      return `${(period / 3600).toFixed(2)} 小时`;
    }
  };

  const speed = calculateSpeed();
  const distance = calculateDistance();
  const period = calculateOrbitalPeriod();
  const displayName = body?.name || (body?.type === 'star' ? '主星' : '行星');

  if (isMobile) {
    return (
      <>
        <div className={`info-bubble ${isVisible && !isClosing ? 'visible' : ''} ${isClosing ? 'closing' : ''}`}>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
          <div className="bubble-header">
            <div
              className="body-indicator"
              style={{ backgroundColor: body?.color, boxShadow: `0 0 12px ${body?.color}` }}
            />
            <h3>{displayName}</h3>
          </div>
          <div className="bubble-stats">
            <div className="stat-item">
              <span className="stat-label">速度</span>
              <span className="stat-value">{speed.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">距离</span>
              <span className="stat-value">{distance.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <style>{mobileStyles}</style>
      </>
    );
  }

  return (
    <>
      <div className={`info-panel ${isVisible && !isClosing ? 'visible' : ''} ${isClosing ? 'closing' : ''}`}>
        <button className="close-btn" onClick={handleClose}>
          ×
        </button>
        
        <div className="panel-header">
          <div
            className="body-icon"
            style={{ 
              backgroundColor: body?.color,
              boxShadow: `0 0 30px ${body?.color}`,
            }}
          />
          <h2>{displayName}</h2>
          <span className="body-type-tag">
            {body?.type === 'star' ? '主星' : '行星'}
          </span>
        </div>

        <div className="stats-section">
          <h4>基本信息</h4>
          
          <div className="stat-row">
            <span className="stat-label">质量</span>
            <div className="stat-bar-container">
              <div 
                className="stat-bar" 
                style={{ 
                  width: `${(body?.mass || 0) / 100 * 100}%`,
                  background: `linear-gradient(90deg, #6c63ff, #8b7dff)`
                }}
              />
              <span className="stat-value">{body?.mass}</span>
            </div>
          </div>

          <div className="stat-row">
            <span className="stat-label">当前速度</span>
            <div className="stat-bar-container">
              <div 
                className="stat-bar" 
                style={{ 
                  width: `${Math.min(speed / 10 * 100, 100)}%`,
                  background: `linear-gradient(90deg, #4ecdc4, #44a08d)`
                }}
              />
              <span className="stat-value">{speed.toFixed(2)} u/s</span>
            </div>
          </div>

          {body?.type === 'planet' && (
            <>
              <div className="stat-row">
                <span className="stat-label">距主星距离</span>
                <div className="stat-bar-container">
                  <div 
                    className="stat-bar" 
                    style={{ 
                      width: `${Math.min(distance / 200 * 100, 100)}%`,
                      background: `linear-gradient(90deg, #ff6b9d, #ff8c42)`
                    }}
                  />
                  <span className="stat-value">{distance.toFixed(1)} u</span>
                </div>
              </div>

              <div className="stat-row">
                <span className="stat-label">轨道周期</span>
                <span className="stat-value period">{period}</span>
              </div>
            </>
          )}
        </div>

        {body?.type === 'planet' && (
          <div className="tips-section">
            <h4>💡 天文小知识</h4>
            <p>
              根据开普勒第三定律，行星轨道半长轴的立方与公转周期的平方成正比。
              质量越大的主星，行星的公转速度越快。
            </p>
          </div>
        )}
      </div>
      <style>{desktopStyles}</style>
    </>
  );
}

const desktopStyles = `
.info-panel {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%) scale(0.9);
  width: 280px;
  background: rgba(20, 20, 60, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(108, 99, 255, 0.3);
  padding: 24px;
  color: white;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.info-panel.visible {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}

.info-panel.closing {
  opacity: 0;
  transform: translateY(-50%) scale(0.8);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  transform: rotate(90deg);
}

.panel-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.body-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.panel-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
}

.body-type-tag {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(108, 99, 255, 0.3);
  border-radius: 12px;
  font-size: 11px;
  color: #8b7dff;
}

.stats-section {
  margin-bottom: 16px;
}

.stats-section h4 {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  min-width: 70px;
}

.stat-bar-container {
  flex: 1;
  height: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.stat-bar {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
}

.stat-bar-container .stat-value {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.stat-row > .stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #8b7dff;
}

.stat-value.period {
  background: rgba(255, 221, 68, 0.2);
  color: #ffdd44;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
}

.tips-section {
  background: rgba(78, 205, 196, 0.1);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(78, 205, 196, 0.2);
}

.tips-section h4 {
  font-size: 12px;
  color: #4ecdc4;
  margin-bottom: 8px;
}

.tips-section p {
  font-size: 11px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
}
`;

const mobileStyles = `
.info-bubble {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(20, 20, 60, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(108, 99, 255, 0.3);
  padding: 14px 16px;
  color: white;
  z-index: 99;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 180px;
}

.info-bubble.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.info-bubble.closing {
  opacity: 0;
  transform: translateY(-20px) scale(0.8);
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bubble-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-right: 20px;
}

.body-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bubble-header h3 {
  font-size: 14px;
  font-weight: 600;
}

.bubble-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #8b7dff;
}
`;
