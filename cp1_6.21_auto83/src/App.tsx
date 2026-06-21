import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import GeneHelix from './GeneHelix';
import InteractionPanel from './InteractionPanel';
import { AnimationController } from './AnimationController';
import { 
  BaseType, 
  SelectedBaseInfo, 
  PlaybackSpeed, 
  AnimationState,
  BASE_NAMES,
  BASE_NAMES_CN,
  COMPLEMENTARY_BASES,
  BASE_COLORS,
  HELIX_CONFIG
} from './types';

export default function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [highlightBase, setHighlightBase] = useState<BaseType | null>(null);
  const [selectedBase, setSelectedBase] = useState<SelectedBaseInfo | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>(AnimationState.IDLE);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(PlaybackSpeed.NORMAL);
  const [baseCounts, setBaseCounts] = useState<Record<BaseType, number>>({
    A: 0, T: 0, G: 0, C: 0
  });

  const animationControllerRef = useRef<AnimationController | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    animationControllerRef.current = new AnimationController(HELIX_CONFIG.nodeCount);
    
    const counts: Record<BaseType, number> = { A: 0, T: 0, G: 0, C: 0 };
    for (let i = 0; i < HELIX_CONFIG.nodeCount; i++) {
      const types: BaseType[] = ['A', 'T', 'G', 'C'];
      const type = types[Math.floor(Math.random() * 4)] as BaseType;
      counts[type]++;
      counts[COMPLEMENTARY_BASES[type]]++;
    }
    setBaseCounts(counts);

    return () => {
      animationControllerRef.current?.destroy();
    };
  }, []);

  const handleSearch = useCallback((baseType: BaseType | null) => {
    setHighlightBase(baseType);
  }, []);

  const handleDisassemble = useCallback(() => {
    if (!animationControllerRef.current) return;
    
    const currentState = animationControllerRef.current.getAnimationState();
    
    if (currentState === AnimationState.DISASSEMBLED || 
        currentState === AnimationState.DISASSEMBLING) {
      animationControllerRef.current.reassemble();
      setAnimationState(AnimationState.REASSEMBLING);
      
      setTimeout(() => {
        if (animationControllerRef.current?.getAnimationState() === AnimationState.IDLE) {
          setAnimationState(AnimationState.IDLE);
        }
      }, 1500);
    } else {
      animationControllerRef.current.disassemble();
      setAnimationState(AnimationState.DISASSEMBLING);
      
      setTimeout(() => {
        if (animationControllerRef.current?.getAnimationState() === AnimationState.DISASSEMBLED) {
          setAnimationState(AnimationState.DISASSEMBLED);
        }
      }, 2000);
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (!animationControllerRef.current) return;
    
    const currentState = animationControllerRef.current.getAnimationState();
    
    if (currentState === AnimationState.PLAYING) {
      animationControllerRef.current.pause();
      setAnimationState(AnimationState.PAUSED);
    } else if (currentState === AnimationState.PAUSED || currentState === AnimationState.IDLE) {
      animationControllerRef.current.play();
      setAnimationState(AnimationState.PLAYING);
    }
  }, []);

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    animationControllerRef.current?.setPlaybackSpeed(speed);
  }, []);

  const handleBaseClick = useCallback((info: SelectedBaseInfo) => {
    setSelectedBase(info);
  }, []);

  const handleCloseInfoPanel = useCallback(() => {
    setSelectedBase(null);
  }, []);

  const isPlaying = animationState === AnimationState.PLAYING;

  return (
    <div className="app-container">
      <div 
        className="scene-container"
        style={{ right: isMobile ? 0 : '240px' }}
      >
        <Canvas
          camera={{ position: [100, 80, 100], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
        >
          {animationControllerRef.current && (
            <GeneHelix
              animationController={animationControllerRef.current}
              animationState={animationState}
              highlightBase={highlightBase}
              onBaseClick={handleBaseClick}
            />
          )}
        </Canvas>
      </div>

      {!isMobile && (
        <InteractionPanel
          onSearch={handleSearch}
          onDisassemble={handleDisassemble}
          animationState={animationState}
          baseCounts={baseCounts}
          isMobile={isMobile}
          isDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        />
      )}

      {isMobile && (
        <InteractionPanel
          onSearch={handleSearch}
          onDisassemble={handleDisassemble}
          animationState={animationState}
          baseCounts={baseCounts}
          isMobile={isMobile}
          isDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        />
      )}

      <div 
        className="timeline-container"
        style={{ 
          width: isMobile ? '100%' : 'calc(90% - 240px)',
          left: isMobile ? 0 : 'calc(5% - 120px)'
        }}
      >
        <div className="timeline-controls">
          <button 
            className="play-btn"
            onClick={handleTogglePlay}
            disabled={animationState === AnimationState.DISASSEMBLING || 
                     animationState === AnimationState.DISASSEMBLED ||
                     animationState === AnimationState.REASSEMBLING}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            )}
          </button>

          <div className="speed-controls">
            {[0.5, 1, 2].map(speed => (
              <button
                key={speed}
                className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => handleSpeedChange(speed as PlaybackSpeed)}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="timeline-track">
            <div className="timeline-progress" />
          </div>
        </div>
      </div>

      {selectedBase && (
        <div className="info-panel-overlay" onClick={handleCloseInfoPanel}>
          <div className="info-panel" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseInfoPanel}>
              ×
            </button>
            <h3 className="info-title">
              <span 
                className="base-indicator"
                style={{ backgroundColor: BASE_COLORS[selectedBase.type] }}
              />
              {BASE_NAMES_CN[selectedBase.type]} ({selectedBase.type})
            </h3>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">英文名称</span>
                <span className="info-value">{BASE_NAMES[selectedBase.type]}</span>
              </div>
              <div className="info-row">
                <span className="info-label">配对类型</span>
                <span className="info-value">
                  <span 
                    className="base-badge"
                    style={{ 
                      backgroundColor: BASE_COLORS[selectedBase.pairType],
                      color: '#0B0C10'
                    }}
                  >
                    {selectedBase.pairType}
                  </span>
                  {' '}{BASE_NAMES_CN[selectedBase.pairType]}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">位置索引</span>
                <span className="info-value">第 {selectedBase.index + 1} 对</span>
              </div>
              <div className="info-row">
                <span className="info-label">空间坐标</span>
                <span className="info-value mono">
                  ({selectedBase.position.x.toFixed(2)}, 
                   {selectedBase.position.y.toFixed(2)}, 
                   {selectedBase.position.z.toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .app-container {
          width: 100%;
          height: 100%;
          position: relative;
          background-color: #0B0C10;
        }

        .scene-container {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 80px;
          transition: right 0.3s ease;
        }

        .timeline-container {
          position: fixed;
          bottom: 20px;
          height: 60px;
          background: rgba(31, 40, 51, 0.9);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          z-index: 40;
          display: flex;
          align-items: center;
          padding: 0 20px;
          transition: width 0.3s ease, left 0.3s ease;
        }

        .timeline-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .play-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #45A29E;
          color: #0B0C10;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s ease, transform 0.2s ease;
          flex-shrink: 0;
        }

        .play-btn:hover:not(:disabled) {
          background: #66FCF1;
          transform: scale(1.05);
        }

        .play-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .play-btn svg {
          width: 18px;
          height: 18px;
        }

        .speed-controls {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }

        .speed-btn {
          width: 48px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: #FFFFFF;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .speed-btn:hover {
          background: rgba(69, 162, 158, 0.2);
        }

        .speed-btn.active {
          background: #45A29E;
          color: #0B0C10;
          font-weight: bold;
        }

        .timeline-track {
          flex: 1;
          height: 4px;
          background: #0B0C10;
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .timeline-progress {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0%;
          background: linear-gradient(90deg, #45A29E, #66FCF1);
          transition: width 0.1s linear;
        }

        .info-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 300;
          animation: fadeIn 0.2s ease;
        }

        .info-panel {
          width: 320px;
          background: rgba(11, 12, 16, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 12px;
          border: 1px solid rgba(69, 162, 158, 0.3);
          padding: 24px;
          color: #FFFFFF;
          font-size: 16px;
          position: relative;
          animation: slideUp 0.3s ease;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        .close-btn {
          position: absolute;
          top: 12px;
          right: 16px;
          background: none;
          border: none;
          color: #C5C6C7;
          font-size: 24px;
          cursor: pointer;
          line-height: 1;
          transition: color 0.2s ease;
        }

        .close-btn:hover {
          color: #66FCF1;
        }

        .info-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .base-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          color: #C5C6C7;
          font-size: 14px;
        }

        .info-value {
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .info-value.mono {
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }

        .base-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .scene-container {
            right: 0 !important;
            bottom: 100px;
          }

          .timeline-container {
            width: 100% !important;
            left: 0 !important;
            bottom: 0;
            border-radius: 12px 12px 0 0;
          }

          .info-panel {
            width: calc(100% - 40px);
            max-width: 320px;
          }
        }
      `}</style>
    </div>
  );
}
