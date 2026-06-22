import { useState, useEffect } from 'react';
import Card from '../components/Card';
import './Dashboard.css';

interface Material {
  id: string;
  name: string;
  image: string;
  quantity: number;
  description: string;
  usageScene: string;
}

interface SubscriptionData {
  plan: 'basic' | 'premium';
  planName: string;
  nextDelivery: string;
  materials: Material[];
}

interface DashboardProps {
  onNavigate: (page: 'dashboard' | 'subscription') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [prevCountdown, setPrevCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hoveredMaterial, setHoveredMaterial] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/subscription')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch subscription:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(data.nextDelivery).getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setPrevCountdown(countdown);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [data]);

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => new Set(prev).add(id));
  };

  const FlipNumber = ({ value, prevValue, label }: { value: number; prevValue: number; label: string }) => {
    const displayValue = value.toString().padStart(2, '0');
    const prevDisplayValue = prevValue.toString().padStart(2, '0');
    const isFlipping = value !== prevValue;

    return (
      <div className="flip-unit">
        <div className={`flip-card ${isFlipping ? 'flipping' : ''}`}>
          <div className="flip-card-front">
            <span className="flip-number">{displayValue}</span>
          </div>
          <div className="flip-card-back">
            <span className="flip-number">{prevDisplayValue}</span>
          </div>
        </div>
        <span className="flip-label">{label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-error">
        <p>加载失败，请刷新重试</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <h1 className="dashboard-title">我的手作订阅</h1>
        <p className="dashboard-subtitle">探索每月精选材料包，开启创意之旅</p>

        <div className="dashboard-top">
          <div 
            className="plan-section"
            onClick={() => onNavigate('subscription')}
            data-ripple-trigger
          >
            <Card hoverable className={`plan-card plan-${data.plan}`}>
              <div className="plan-card-content">
                <div className="plan-badge">{data.planName}</div>
                <h3 className="plan-title">当前套餐</h3>
                <p className="plan-desc">
                  {data.plan === 'premium' 
                    ? '尊享全部材料包与独家创作指南' 
                    : '精选基础材料包与入门教程'}
                </p>
                <div className="plan-features">
                  <div className="plan-feature">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                    </svg>
                    <span>{data.materials.length} 种精选材料</span>
                  </div>
                  <div className="plan-feature">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                    </svg>
                    <span>专属创作指南</span>
                  </div>
                  <div className="plan-feature">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                    </svg>
                    <span>优先配送</span>
                  </div>
                </div>
                <button className="plan-btn">管理订阅 →</button>
              </div>
            </Card>
          </div>

          <Card className="countdown-card">
            <div className="countdown-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#D4AF37"/>
              </svg>
              <h3>下次配送倒计时</h3>
            </div>
            <div className="countdown-display">
              <FlipNumber value={countdown.days} prevValue={prevCountdown.days} label="天" />
              <span className="countdown-separator">:</span>
              <FlipNumber value={countdown.hours} prevValue={prevCountdown.hours} label="时" />
              <span className="countdown-separator">:</span>
              <FlipNumber value={countdown.minutes} prevValue={prevCountdown.minutes} label="分" />
              <span className="countdown-separator">:</span>
              <FlipNumber value={countdown.seconds} prevValue={prevCountdown.seconds} label="秒" />
            </div>
            <p className="countdown-hint">材料包正在精心准备中</p>
          </Card>
        </div>

        <div className="materials-section">
          <div className="section-header">
            <h2>材料包库存</h2>
            <p className="section-desc">本月精选 {data.materials.length} 种高品质手工材料</p>
          </div>
          <div className="materials-grid">
            {data.materials.map(material => (
              <div 
                key={material.id}
                className="material-item"
                onMouseEnter={() => setHoveredMaterial(material.id)}
                onMouseLeave={() => setHoveredMaterial(null)}
              >
                <Card hoverable className="material-card">
                  <div className="material-image-wrapper">
                    <div className={`material-image-placeholder ${loadedImages.has(material.id) ? 'hidden' : ''}`}>
                      <div className="placeholder-blur"></div>
                    </div>
                    <img
                      src={material.image}
                      alt={material.name}
                      className={`material-image ${loadedImages.has(material.id) ? 'loaded' : ''}`}
                      onLoad={() => handleImageLoad(material.id)}
                    />
                  </div>
                  <div className="material-info">
                    <h4 className="material-name">{material.name}</h4>
                    <span className="material-quantity">×{material.quantity}</span>
                  </div>
                </Card>
                
                {hoveredMaterial === material.id && (
                  <div className="material-tooltip">
                    <div className="tooltip-content">
                      <h4>{material.name}</h4>
                      <p className="tooltip-desc">{material.description}</p>
                      <div className="tooltip-scene">
                        <span className="scene-label">使用场景：</span>
                        <span className="scene-text">{material.usageScene}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
