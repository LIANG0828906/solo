import { useEffect, useRef, useState, useCallback } from 'react';
import { GrowthEngine, type GrowthStats } from './growthEngine';
import { Renderer } from './renderer';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GrowthEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const hasSeedRef = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(false);

  const [stats, setStats] = useState<GrowthStats>({
    totalLength: 0,
    lateralRootCount: 0,
    maxDepth: 0,
    moistureLevel: 0,
    nodeCount: 0
  });
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [showMoisture, setShowMoisture] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [hasSeed, setHasSeed] = useState<boolean>(false);

  const init = useCallback(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    engineRef.current = new GrowthEngine({
      speedMultiplier: 1,
      showMoisture: false,
      canvasWidth: width,
      canvasHeight: height
    });

    rendererRef.current = new Renderer(canvasRef.current, {
      showMoisture: false,
      backgroundColor: '#3E2723',
      mainRootColor: '#6D4C41',
      lateralRootColor: '#81C784',
      tipColor: '#A5D6A7',
      moistureColor: '#64B5F6',
      mainRootLineWidth: 1.5,
      lateralRootLineWidth: 1,
      tipRadius: 2
    });

    rendererRef.current.setSize(width, height);

    if (rendererRef.current && engineRef.current) {
      rendererRef.current.render(
        engineRef.current.getRoots(),
        engineRef.current.getMoisturePoints()
      );
    }
  }, []);

  const handleResize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current || !engineRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    rendererRef.current.setSize(width, height);
    engineRef.current.updateConfig({
      canvasWidth: width,
      canvasHeight: height
    });
    rendererRef.current.markCacheDirty();
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engineRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    engineRef.current.plantSeed(x, y);
    hasSeedRef.current = true;
    setHasSeed(true);
    isPausedRef.current = false;
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (!hasSeed) return;
    isPausedRef.current = !isPausedRef.current;
    setIsPaused(isPausedRef.current);
  }, [hasSeed]);

  const handleScreenshot = useCallback(() => {
    if (!rendererRef.current) return;

    const dataURL = rendererRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = `root-growth-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, []);

  const handleReset = useCallback(() => {
    if (!engineRef.current || !rendererRef.current) return;
    engineRef.current.reset();
    rendererRef.current.markCacheDirty();
    hasSeedRef.current = false;
    setHasSeed(false);
    isPausedRef.current = false;
    setIsPaused(false);
    setStats({
      totalLength: 0,
      lateralRootCount: 0,
      maxDepth: 0,
      moistureLevel: 0,
      nodeCount: 0
    });
    rendererRef.current.render(
      engineRef.current.getRoots(),
      engineRef.current.getMoisturePoints()
    );
  }, []);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSpeedMultiplier(value);
    if (engineRef.current) {
      engineRef.current.updateConfig({ speedMultiplier: value });
    }
  }, []);

  const handleMoistureToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setShowMoisture(checked);
    if (engineRef.current) {
      engineRef.current.updateConfig({ showMoisture: checked });
    }
    if (rendererRef.current) {
      rendererRef.current.setOptions({ showMoisture: checked });
      rendererRef.current.markCacheDirty();
    }
  }, []);

  useEffect(() => {
    init();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [init, handleResize, togglePause]);

  useEffect(() => {
    let lastTime = 0;
    let frameCount = 0;

    const animate = (time: number) => {
      const delta = time - lastTime;
      
      if (delta >= 16 && !isPausedRef.current && engineRef.current && rendererRef.current) {
        if (hasSeed) {
          engineRef.current.update();
          frameCount++;
          
          if (frameCount % 3 === 0) {
            setStats(engineRef.current.getStats());
          }
        }
        
        rendererRef.current.render(
          engineRef.current.getRoots(),
          engineRef.current.getMoisturePoints()
        );
        
        lastTime = time;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasSeed]);

  return (
    <div className="app-container">
      <div className="canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
        />
      </div>

      <div className={`info-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
        <button
          className="panel-toggle"
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          aria-label={isPanelCollapsed ? '展开面板' : '收起面板'}
        >
          ◀
        </button>

        {!isPanelCollapsed && (
          <>
            <div className="panel-header">🌱 根系生长模拟</div>

            <ul className="stats-list">
              <li>
                <span className="stats-label">总长度</span>
                <span className="stats-value">{stats.totalLength} px</span>
              </li>
              <li>
                <span className="stats-label">侧根数量</span>
                <span className="stats-value">{stats.lateralRootCount}</span>
              </li>
              <li>
                <span className="stats-label">最深深度</span>
                <span className="stats-value">{stats.maxDepth} px</span>
              </li>
              <li>
                <span className="stats-label">土壤湿度</span>
                <span className="stats-value">{stats.moistureLevel}%</span>
              </li>
            </ul>

            <div className="control-section">
              <label className="control-label">生长加速度</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={speedMultiplier}
                  onChange={handleSpeedChange}
                  className="speed-slider"
                />
                <span className="speed-value">{speedMultiplier.toFixed(1)}x</span>
              </div>
            </div>

            <div className="control-section">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showMoisture}
                  onChange={handleMoistureToggle}
                />
                <span className="control-label" style={{ margin: 0 }}>
                  显示水分梯度
                </span>
              </label>
            </div>

            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={togglePause}
                disabled={!hasSeed}
              >
                {isPaused ? '▶ 继续' : '⏸ 暂停'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleScreenshot}
                disabled={!hasSeed}
              >
                📷 截图
              </button>
            </div>

            <div className="button-group">
              <button
                className="btn btn-secondary"
                onClick={handleReset}
              >
                🔄 重置
              </button>
            </div>
          </>
        )}
      </div>

      <div className="hint">
        {!hasSeed ? (
          '点击画布任意位置播种'
        ) : (
          <>
            按 <kbd>空格</kbd> 暂停/继续 · 根会向水分富集区域生长
          </>
        )}
      </div>
    </div>
  );
}

export default App;
