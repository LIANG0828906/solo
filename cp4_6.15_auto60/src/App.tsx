import { useState, useEffect, useCallback, useRef } from 'react';
import CityScene from '@/components/CityScene';
import TimeSlider from '@/components/TimeSlider';
import PieChart from '@/components/PieChart';
import { Zap, Info, Settings } from 'lucide-react';
import type { ZoneType } from '@/utils/particleSystem';

export default function App() {
  const [timeHour, setTimeHour] = useState(8);
  const [populationData, setPopulationData] = useState<Record<ZoneType, number>>({
    residential: 0.4,
    commercial: 0.1,
    office: 0.4,
    other: 0.1,
  });
  const [fps, setFps] = useState(60);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px) and (orientation: landscape)');

    const handleOrientationChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const isMobileLandscape = 'matches' in e ? e.matches : false;
      setIsLandscape(isMobileLandscape);
      setShowSidePanel(!isMobileLandscape);
    };

    handleOrientationChange(mq);

    if (mq.addEventListener) {
      mq.addEventListener('change', handleOrientationChange);
    } else {
      mq.addListener(handleOrientationChange);
    }

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isMobile && isLandscapeMode);
      setShowSidePanel(!(isMobile && isLandscapeMode));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handleOrientationChange);
      } else {
        mq.removeListener(handleOrientationChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const animate = (now: number) => {
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setTimeHour((prev) => {
          const next = prev + delta * 2;
          return next >= 24 ? 0 : next;
        });

        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const handlePopulationChange = useCallback((data: Record<ZoneType, number>) => {
    setPopulationData(data);
  }, []);

  const handleFpsUpdate = useCallback((currentFps: number) => {
    setFps(currentFps);
  }, []);

  const getTimePeriod = (hour: number): string => {
    if (hour >= 5 && hour < 9) return '清晨';
    if (hour >= 9 && hour < 12) return '上午';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 17) return '下午';
    if (hour >= 17 && hour < 20) return '傍晚';
    if (hour >= 20 && hour < 23) return '夜晚';
    return '深夜';
  };

  return (
    <div className="app-container">
      <div className="scene-wrapper">
        <CityScene
          timeHour={timeHour}
          onPopulationChange={handlePopulationChange}
          onFpsUpdate={handleFpsUpdate}
          particleCount={800}
        />
      </div>

      <div className="ui-overlay">
        <div className="top-left-panel glass-panel">
          <div className="title-section">
            <div className="title-icon">
              <Zap size={20} />
            </div>
            <div className="title-text">
              <h1 className="main-title">Urban Flow</h1>
              <p className="subtitle">城市人口流动可视化</p>
            </div>
          </div>
          <div className="time-period-badge">
            {getTimePeriod(timeHour)} · {fps.toFixed(0)} FPS
          </div>
        </div>

        {showSidePanel && (
          <div className="side-panel">
            <PieChart data={populationData} />

            <div className="info-card glass-panel">
              <div className="info-header">
                <Info size={16} />
                <span>操作说明</span>
              </div>
              <div className="info-content">
                <p>🖱️ 左键拖动：旋转视角</p>
                <p>🔍 滚轮滑动：缩放距离</p>
                <p>⏱️ 拖动滑块：调整时间</p>
                <p>▶️ 点击播放：自动循环</p>
              </div>
            </div>

            <button
              className="control-btn glass-panel"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸ 暂停模拟' : '▶ 播放模拟'}
            </button>
          </div>
        )}

        {!showSidePanel && (
          <button
            className="toggle-panel-btn glass-panel"
            onClick={() => setShowSidePanel(true)}
          >
            <Settings size={18} />
          </button>
        )}

        <div className="bottom-panel">
          <TimeSlider
            value={timeHour}
            onChange={setTimeHour}
            min={0}
            max={24}
            step={0.1}
          />
        </div>

        <div className="hint-text">
          <span>左键旋转 · 滚轮缩放 · 拖动滑块控制时间</span>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #1a1a2a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .app-container {
          width: 100vw;
          height: 100vh;
          position: relative;
          background: #1a1a2a;
        }

        .scene-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .ui-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }

        .ui-overlay > * {
          pointer-events: auto;
        }

        .glass-panel {
          background: rgba(42, 42, 58, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }

        .top-left-panel {
          position: absolute;
          top: 24px;
          left: 24px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 220px;
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #ff7f3f, #ffa07f);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .title-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .main-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
        }

        .time-period-badge {
          font-size: 11px;
          color: #4ac7ff;
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          padding: 6px 10px;
          background: rgba(74, 199, 255, 0.1);
          border-radius: 6px;
          display: inline-block;
          width: fit-content;
        }

        .side-panel {
          position: absolute;
          top: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 280px;
        }

        .info-card {
          padding: 16px;
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .info-header svg {
          color: #4ac7ff;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-content p {
          font-size: 10px;
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
        }

        .control-btn {
          padding: 12px 20px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .control-btn:hover {
          background: rgba(255, 127, 63, 0.2);
          border-color: rgba(255, 127, 63, 0.4);
          transform: translateY(-1px);
        }

        .control-btn:active {
          transform: translateY(0);
        }

        .toggle-panel-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .toggle-panel-btn:hover {
          background: rgba(255, 127, 63, 0.2);
          border-color: rgba(255, 127, 63, 0.4);
        }

        .bottom-panel {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: min(600px, 90vw);
        }

        .hint-text {
          position: absolute;
          bottom: 100px;
          left: 24px;
          font-size: 10px;
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          color: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 768px) {
          .top-left-panel {
            top: 12px;
            left: 12px;
            padding: 12px 16px;
            min-width: auto;
          }

          .main-title {
            font-size: 15px;
          }

          .subtitle {
            font-size: 10px;
          }

          .title-icon {
            width: 30px;
            height: 30px;
          }

          .title-icon svg {
            width: 16px;
            height: 16px;
          }

          .side-panel {
            top: 12px;
            right: 12px;
            width: 240px;
            gap: 12px;
          }

          .bottom-panel {
            bottom: 12px;
            width: calc(100vw - 24px);
          }

          .hint-text {
            display: none;
          }
        }

        @media (max-width: 768px) and (orientation: landscape) {
          .side-panel {
            display: none;
          }

          .toggle-panel-btn {
            display: flex;
          }

          .bottom-panel {
            bottom: 8px;
            width: calc(100vw - 16px);
          }
        }

        @media (min-width: 769px) {
          .toggle-panel-btn {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
