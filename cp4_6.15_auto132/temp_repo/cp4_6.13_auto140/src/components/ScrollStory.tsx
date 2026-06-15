import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { StoryScene, ChartConfig, ParsedCSVData } from '../types';
import { ANIMATION_DURATION } from '../utils/storyGenerator';

interface ScrollStoryProps {
  scenes: StoryScene[];
  data: ParsedCSVData;
  config: ChartConfig;
}

const ScrollStory: React.FC<ScrollStoryProps> = ({ scenes, data, config }) => {
  const [visibleScenes, setVisibleScenes] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sceneRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setSceneRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      sceneRefs.current.set(id, el);
    } else {
      sceneRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-scene-id');
          if (id && entry.isIntersecting) {
            setVisibleScenes(prev => {
              if (!prev.has(id)) {
                const newSet = new Set(prev);
                newSet.add(id);
                return newSet;
              }
              return prev;
            });
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    sceneRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [scenes]);

  useEffect(() => {
    sceneRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });
  }, [scenes.length]);

  const formatValue = (value: number, decimals: number = 1): string => {
    return value.toFixed(decimals);
  };

  const getSceneIcon = (type: string) => {
    switch (type) {
      case 'opening':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        );
      case 'turning-point':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        );
      case 'trend':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="16" />
            <line x1="3" y1="20" x2="21" y2="20" />
            <path d="M6,16 L12,10 L18,4" strokeDasharray="4,2" />
          </svg>
        );
      case 'summary':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getSceneColor = (type: string): string => {
    switch (type) {
      case 'opening':
        return '#3357FF';
      case 'turning-point':
        return '#FF5733';
      case 'trend':
        return '#33FF57';
      case 'summary':
        return '#FF33A6';
      default:
        return '#666666';
    }
  };

  return (
    <div className="scroll-story-container">
      <h2 className="story-title">数据故事</h2>
      <p className="story-subtitle">向下滚动探索数据背后的故事</p>
      
      <div className="scenes-wrapper">
        {scenes.map((scene, index) => {
          const isVisible = visibleScenes.has(scene.id);
          const sceneColor = getSceneColor(scene.type);
          
          return (
            <div
              key={scene.id}
              ref={(el) => setSceneRef(scene.id, el)}
              data-scene-id={scene.id}
              className={`scene-card ${isVisible ? 'visible' : ''}`}
              style={{
                '--scene-color': sceneColor,
                '--animation-delay': `${scene.animationDelay}ms`,
                '--animation-duration': `${ANIMATION_DURATION}ms`
              } as React.CSSProperties}
            >
              <div className="scene-header">
                <div 
                  className="scene-icon" 
                  style={{ color: sceneColor }}
                >
                  {getSceneIcon(scene.type)}
                </div>
                <div className="scene-number" style={{ background: sceneColor }}>
                  {index + 1}
                </div>
              </div>
              
              <div className="scene-content">
                <h3 className="scene-title">{scene.title}</h3>
                <p className="scene-text">{scene.content}</p>
                
                {scene.highlightData && Object.keys(scene.highlightData).length > 0 && (
                  <div className="highlight-grid">
                    {Object.entries(scene.highlightData).map(([key, value]) => {
                      const fieldName = key.replace(/_max|_min|_avg|_slope/g, '');
                      const metricType = key.includes('_max') ? '最大值' : 
                                        key.includes('_min') ? '最小值' : 
                                        key.includes('_avg') ? '平均值' : '斜率';
                      const fieldColor = config.fieldColors[fieldName] || '#666';
                      
                      return (
                        <div 
                          key={key} 
                          className="highlight-item"
                          style={{ borderColor: fieldColor }}
                        >
                          <span className="highlight-label">
                            {fieldName} {metricType}
                          </span>
                          <span 
                            className="highlight-value"
                            style={{ color: fieldColor }}
                          >
                            {formatValue(value, Math.abs(value) >= 10 ? 0 : 1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {scene.chartAnnotation && (
                  <div className="annotation-bubble">
                    <div className="bubble-dot" style={{ background: sceneColor }} />
                    <span className="bubble-text">
                      {scene.chartAnnotation.xValue.toLocaleDateString('zh-CN', { 
                        year: 'numeric', 
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="scene-connector" style={{ background: `linear-gradient(to bottom, ${sceneColor}, transparent)` }} />
            </div>
          );
        })}
      </div>
      
      <div className="scroll-indicator">
        <div className="scroll-arrow">↓</div>
        <span>继续探索</span>
      </div>
      
      <style>{`
        .scroll-story-container {
          width: 100%;
          max-width: 900px;
          margin: 60px auto 0;
          padding: 0 20px 100px;
        }
        
        .story-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          margin: 0 0 8px 0;
          text-align: center;
          letter-spacing: -0.5px;
        }
        
        .story-subtitle {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 40px 0;
          font-size: 14px;
        }
        
        .scenes-wrapper {
          position: relative;
        }
        
        .scene-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 32px;
          opacity: 0;
          transform: translateY(40px);
          transition: 
            opacity var(--animation-duration) cubic-bezier(0.16, 1, 0.3, 1),
            transform var(--animation-duration) cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--animation-delay);
          backdrop-filter: blur(10px);
        }
        
        .scene-card.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .scene-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--scene-color), transparent);
          border-radius: 20px 20px 0 0;
          opacity: 0.6;
        }
        
        .scene-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        
        .scene-icon {
          opacity: 0.9;
        }
        
        .scene-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a1a2e;
          font-weight: 700;
          font-size: 14px;
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .scene-content {
          position: relative;
          z-index: 1;
        }
        
        .scene-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          margin: 0 0 16px 0;
          line-height: 1.3;
        }
        
        .scene-text {
          font-size: 16px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 24px 0;
        }
        
        .highlight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-top: 20px;
        }
        
        .highlight-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: transform 0.3s ease;
        }
        
        .highlight-item:hover {
          transform: translateY(-2px);
        }
        
        .highlight-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }
        
        .highlight-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
        }
        
        .annotation-bubble {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          padding: 10px 16px;
          background: rgba(255, 87, 51, 0.1);
          border: 1px solid rgba(255, 87, 51, 0.3);
          border-radius: 20px;
        }
        
        .bubble-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        
        .bubble-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }
        
        .scene-connector {
          position: absolute;
          bottom: -32px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 32px;
          opacity: 0.3;
        }
        
        .scene-card:last-child .scene-connector {
          display: none;
        }
        
        .scroll-indicator {
          text-align: center;
          margin-top: 40px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
          animation: bounce 2s ease-in-out infinite;
        }
        
        .scroll-arrow {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @media (max-width: 768px) {
          .scroll-story-container {
            padding: 0 16px 80px;
          }
          
          .story-title {
            font-size: 24px;
          }
          
          .scene-card {
            padding: 24px;
          }
          
          .scene-title {
            font-size: 20px;
          }
          
          .scene-text {
            font-size: 15px;
          }
          
          .highlight-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .highlight-value {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default ScrollStory;
