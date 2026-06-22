
import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import type { Particle, CurrentParams, HeatmapGrid } from './types';
import { particleSimulator } from './engine/particleSimulator';
import { heatmapRenderer } from './visual/heatmapRenderer';
import { SceneSetup } from './visual/SceneSetup';
import './App.css';

const DEFAULT_PARAMS: CurrentParams = {
  currentSpeed: 1.5,
  vortexStrength: 1.0,
  releaseRate: 5
};

const MAX_HISTORY_FRAMES = 600;

interface FrameData {
  particles: Particle[];
  heatmap?: HeatmapGrid[];
}

function App() {
  const [params, setParams] = useState<CurrentParams>(DEFAULT_PARAMS);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapGrid[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(60);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const frameHistoryRef = useRef<FrameData[]>([]);
  const simulationTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const fpsTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();
  const isDraggingTimelineRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const resetSimulation = useCallback((newParams: CurrentParams) => {
    particleSimulator.reset(newParams);
    frameHistoryRef.current = [];
    simulationTimeRef.current = 0;
    setCurrentFrame(0);
    setTotalFrames(0);
    setHeatmapData([]);
    setShowHeatmap(false);
    const initialParticles = particleSimulator.getParticles();
    setParticles(initialParticles);
    frameHistoryRef.current.push({ particles: [...initialParticles.map(p => ({ ...p }))] });
    setTotalFrames(1);
  }, []);

  useEffect(() => {
    resetSimulation(params);
  }, [params.currentSpeed, params.vortexStrength]);

  useEffect(() => {
    if (!isPlaying || isDraggingTimelineRef.current) return;

    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;

      simulationTimeRef.current += dt;
      
      const currentParticles = particleSimulator.update(dt, simulationTimeRef.current, params);
      setParticles(currentParticles);

      const frameData: FrameData = {
        particles: currentParticles.map(p => ({ ...p }))
      };
      
      if (frameHistoryRef.current.length >= MAX_HISTORY_FRAMES) {
        frameHistoryRef.current.shift();
      }
      frameHistoryRef.current.push(frameData);
      
      setTotalFrames(frameHistoryRef.current.length);
      setCurrentFrame(frameHistoryRef.current.length - 1);

      frameCountRef.current++;
      if (now - fpsTimeRef.current >= 1000) {
        setFps(Math.round(frameCountRef.current * 1000 / (now - fpsTimeRef.current)));
        frameCountRef.current = 0;
        fpsTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastFrameTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, params]);

  const handleTimelineDragStart = () => {
    isDraggingTimelineRef.current = true;
    setIsPlaying(false);
  };

  const handleTimelineChange = (value: number) => {
    const frameIndex = Math.min(value, frameHistoryRef.current.length - 1);
    setCurrentFrame(frameIndex);
    const frameData = frameHistoryRef.current[frameIndex];
    if (frameData) {
      setParticles(frameData.particles);
      if (frameData.heatmap) {
        setHeatmapData(frameData.heatmap);
      }
    }
  };

  const handleTimelineDragEnd = () => {
    isDraggingTimelineRef.current = false;
    const frameData = frameHistoryRef.current[currentFrame];
    if (frameData) {
      particleSimulator.particles = frameData.particles.map(p => ({ ...p }));
    }
    setIsPlaying(true);
    lastFrameTimeRef.current = performance.now();
  };

  const handleComputeHeatmap = () => {
    const currentParticles = frameHistoryRef.current[currentFrame]?.particles || particles;
    const heatmap = heatmapRenderer.computeHeatmap(currentParticles);
    setHeatmapData(heatmap);
    setShowHeatmap(true);
    
    if (frameHistoryRef.current[currentFrame]) {
      frameHistoryRef.current[currentFrame].heatmap = heatmap;
    }
  };

  const handleParamChange = (key: keyof CurrentParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const particleCount = particles.length;

  return (
    <div className="app-container">
      <div className="canvas-wrapper">
        <Canvas
          camera={{ position: [40, 30, 40], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={['#0A1128']} />
          <SceneSetup
            particles={particles}
            heatmapData={heatmapData}
            showHeatmap={showHeatmap}
            heatmapOpacity={heatmapOpacity}
          />
        </Canvas>
      </div>

      <div className={`control-panel ${isMobile ? 'mobile' : ''} ${panelExpanded ? 'expanded' : 'collapsed'}`}>
        {!isMobile || panelExpanded ? (
          <div className="panel-content">
            {isMobile && (
              <div className="panel-header" onClick={() => setPanelExpanded(false)}>
                <span>参数控制</span>
                <span className="collapse-icon">▼</span>
              </div>
            )}
            
            <div className="slider-group">
              <label className="slider-label">
                <span>洋流速度</span>
                <span className="slider-value">{params.currentSpeed.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={params.currentSpeed}
                onChange={(e) => handleParamChange('currentSpeed', parseFloat(e.target.value))}
                className="custom-slider"
              />
            </div>

            <div className="slider-group">
              <label className="slider-label">
                <span>涡旋强度</span>
                <span className="slider-value">{params.vortexStrength.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.1"
                value={params.vortexStrength}
                onChange={(e) => handleParamChange('vortexStrength', parseFloat(e.target.value))}
                className="custom-slider"
              />
            </div>

            <div className="slider-group">
              <label className="slider-label">
                <span>颗粒释放量</span>
                <span className="slider-value">{params.releaseRate}/帧</span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={params.releaseRate}
                onChange={(e) => handleParamChange('releaseRate', parseFloat(e.target.value))}
                className="custom-slider"
              />
            </div>

            <button className="compute-btn" onClick={handleComputeHeatmap}>
              开始计算热力图
            </button>
          </div>
        ) : (
          <div className="panel-collapsed" onClick={() => setPanelExpanded(true)}>
            <span>⚙ 参数设置</span>
          </div>
        )}
      </div>

      <button
        className={`heatmap-toggle ${showHeatmap ? 'active' : ''}`}
        onClick={() => setShowHeatmap(!showHeatmap)}
      >
        {showHeatmap ? '关闭热力图' : '开启热力图'}
      </button>

      {showHeatmap && (
        <div className="opacity-control">
          <label>热力图透明度</label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
            className="custom-slider"
          />
        </div>
      )}

      <div className="stats-panel">
        <div className="stat-item">
          <span className="stat-label">帧率</span>
          <span className="stat-value">{fps} FPS</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">颗粒数</span>
          <span className="stat-value">{particleCount}</span>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline-info">
          <span>帧: {currentFrame + 1} / {totalFrames}</span>
          <button
            className="play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
        </div>
        <input
          type="range"
          min="0"
          max={Math.max(totalFrames - 1, 0)}
          value={currentFrame}
          onChange={(e) => handleTimelineChange(parseInt(e.target.value))}
          onMouseDown={handleTimelineDragStart}
          onMouseUp={handleTimelineDragEnd}
          onTouchStart={handleTimelineDragStart}
          onTouchEnd={handleTimelineDragEnd}
          className="timeline-slider"
        />
      </div>
    </div>
  );
}

export default App;
