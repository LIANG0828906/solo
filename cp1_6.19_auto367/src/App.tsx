import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BulletCanvas from './components/BulletCanvas';
import { useEditorStore, PatternType } from './store/editorStore';
import { colorThemes, ColorTheme } from './modules/bulletPatterns';

const patternLabels: Record<PatternType, string> = {
  fan: '扇形',
  spiral: '螺旋',
  wave: '波浪',
  random: '随机散射',
};

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-container">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ThemeButton({
  theme,
  active,
  onClick,
}: {
  theme: ColorTheme;
  active: boolean;
  onClick: () => void;
}) {
  const gradientStyle = {
    background: `linear-gradient(90deg, ${theme.colors.join(', ')})`,
  };

  return (
    <motion.button
      className={`theme-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 0.97 }}
      whileTap={{ scale: 0.93 }}
      title={theme.name}
    >
      <div className="gradient-preview" style={gradientStyle} />
    </motion.button>
  );
}

export default function App() {
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const patternType = useEditorStore((s) => s.patternType);
  const secondaryPatternType = useEditorStore((s) => s.secondaryPatternType);
  const overlayMode = useEditorStore((s) => s.overlayMode);
  const bulletSpeed = useEditorStore((s) => s.bulletSpeed);
  const theme = useEditorStore((s) => s.theme);
  const performanceMonitoring = useEditorStore((s) => s.performanceMonitoring);
  const stats = useEditorStore((s) => s.stats);

  const fanParams = useEditorStore((s) => s.fanParams);
  const spiralParams = useEditorStore((s) => s.spiralParams);
  const waveParams = useEditorStore((s) => s.waveParams);
  const randomParams = useEditorStore((s) => s.randomParams);

  const setPatternType = useEditorStore((s) => s.setPatternType);
  const setSecondaryPatternType = useEditorStore((s) => s.setSecondaryPatternType);
  const setOverlayMode = useEditorStore((s) => s.setOverlayMode);
  const setBulletSpeed = useEditorStore((s) => s.setBulletSpeed);
  const setTheme = useEditorStore((s) => s.setTheme);
  const setPerformanceMonitoring = useEditorStore((s) => s.setPerformanceMonitoring);
  const setFanParams = useEditorStore((s) => s.setFanParams);
  const setSpiralParams = useEditorStore((s) => s.setSpiralParams);
  const setWaveParams = useEditorStore((s) => s.setWaveParams);
  const setRandomParams = useEditorStore((s) => s.setRandomParams);
  const startPerformanceTest = useEditorStore((s) => s.startPerformanceTest);
  const resetStats = useEditorStore((s) => s.resetStats);

  useEffect(() => {
    const fn = (window as unknown as { __updateBulletColors?: () => void }).__updateBulletColors;
    if (fn) fn();
  }, [theme]);

  const handleFire = () => {
    const fn = (window as unknown as { __fireBullets?: (force?: boolean) => void }).__fireBullets;
    if (fn) fn(false);
  };

  const handleReset = () => {
    const fn = (window as unknown as { __resetCanvas?: () => void }).__resetCanvas;
    if (fn) fn();
    resetStats();
  };

  const handlePause = () => {
    const fn = (window as unknown as { __togglePause?: () => boolean }).__togglePause;
    if (fn) {
      const paused = fn();
      setIsPaused(paused);
    }
  };

  const handlePerformanceTest = () => {
    resetStats();
    startPerformanceTest();
    const fireFn = (window as unknown as { __fireBullets?: (force?: boolean) => void }).__fireBullets;
    if (fireFn) fireFn(true);
  };

  const renderParamsControls = () => {
    switch (patternType) {
      case 'fan':
        return (
          <>
            <Slider
              label="角度范围 (°)"
              value={fanParams.angleRange}
              min={30}
              max={360}
              onChange={(v) => setFanParams({ angleRange: v })}
            />
            <Slider
              label="子弹数量"
              value={fanParams.bulletCount}
              min={10}
              max={200}
              onChange={(v) => setFanParams({ bulletCount: v })}
            />
          </>
        );
      case 'spiral':
        return (
          <>
            <Slider
              label="旋转圈数"
              value={spiralParams.rotations}
              min={1}
              max={10}
              onChange={(v) => setSpiralParams({ rotations: v })}
            />
            <Slider
              label="每圈子弹数"
              value={spiralParams.bulletsPerRotation}
              min={1}
              max={15}
              onChange={(v) => setSpiralParams({ bulletsPerRotation: v })}
            />
          </>
        );
      case 'wave':
        return (
          <>
            <Slider
              label="振幅"
              value={waveParams.amplitude}
              min={20}
              max={100}
              onChange={(v) => setWaveParams({ amplitude: v })}
            />
            <Slider
              label="频率"
              value={waveParams.frequency}
              min={1}
              max={10}
              onChange={(v) => setWaveParams({ frequency: v })}
            />
            <Slider
              label="子弹数量"
              value={waveParams.bulletCount}
              min={20}
              max={300}
              onChange={(v) => setWaveParams({ bulletCount: v })}
            />
          </>
        );
      case 'random':
        return (
          <>
            <Slider
              label="最小速度"
              value={randomParams.minSpeed}
              min={1}
              max={10}
              onChange={(v) => setRandomParams({ minSpeed: Math.min(v, randomParams.maxSpeed) })}
            />
            <Slider
              label="最大速度"
              value={randomParams.maxSpeed}
              min={1}
              max={10}
              onChange={(v) => setRandomParams({ maxSpeed: Math.max(v, randomParams.minSpeed) })}
            />
            <Slider
              label="子弹数量"
              value={randomParams.bulletCount}
              min={50}
              max={500}
              onChange={(v) => setRandomParams({ bulletCount: v })}
            />
          </>
        );
    }
  };

  return (
    <div className="app-container">
      <div className="top-toolbar">
        <h1>🎯 弹幕编辑器</h1>
        <motion.button
          className="btn drawer-toggle"
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          whileTap={{ scale: 0.95 }}
        >
          {panelCollapsed ? '展开面板' : '折叠面板'}
        </motion.button>
        <div style={{ flex: 1 }} />
        <motion.button
          className="btn"
          onClick={handleFire}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🚀 发射
        </motion.button>
        <motion.button
          className={`btn ${isPaused ? 'active' : ''}`}
          onClick={handlePause}
          whileTap={{ scale: 0.95 }}
        >
          {isPaused ? '▶ 继续' : '⏸ 暂停'}
        </motion.button>
        <motion.button
          className="btn secondary"
          onClick={handleReset}
          whileTap={{ scale: 0.95 }}
        >
          ↺ 重置
        </motion.button>
        <motion.button
          className="btn secondary"
          onClick={handlePerformanceTest}
          disabled={stats.isTesting}
          whileTap={{ scale: 0.95 }}
          style={stats.isTesting ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
        >
          {stats.isTesting ? '⏳ 测试中...' : '📊 性能测试'}
        </motion.button>
      </div>

      <div className="main-content">
        <AnimatePresence>
          {!panelCollapsed && (
            <motion.div
              className="editor-panel"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="section">
                <div className="section-title">弹幕类型</div>
                <div className="btn-group">
                  {(['fan', 'spiral', 'wave', 'random'] as PatternType[]).map((type) => (
                    <motion.button
                      key={type}
                      className={`btn ${patternType === type ? 'active' : ''}`}
                      onClick={() => setPatternType(type)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {patternLabels[type]}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="section-title">参数调节</div>
                {renderParamsControls()}
                <Slider
                  label="子弹速度"
                  value={bulletSpeed}
                  min={1}
                  max={10}
                  onChange={setBulletSpeed}
                />
              </div>

              <div className="section">
                <div className="switch-container">
                  <span className="section-title" style={{ margin: 0 }}>
                    叠加模式
                  </span>
                  <div
                    className={`switch ${overlayMode ? 'on' : ''}`}
                    onClick={() => setOverlayMode(!overlayMode)}
                  >
                    <div className="switch-thumb" />
                  </div>
                </div>
                {overlayMode && (
                  <div className="section" style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8 }}>
                      第二弹幕（从左上角发射）
                    </div>
                    <div className="btn-group">
                      {(['fan', 'spiral', 'wave', 'random'] as PatternType[]).map((type) => (
                        <motion.button
                          key={type}
                          className={`btn ${secondaryPatternType === type ? 'active' : ''}`}
                          onClick={() => setSecondaryPatternType(type)}
                          whileTap={{ scale: 0.95 }}
                          style={{ fontSize: 12, padding: '6px 8px' }}
                        >
                          {patternLabels[type]}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="section">
                <div className="section-title">颜色主题</div>
                <div className="theme-buttons">
                  {colorThemes.map((t) => (
                    <ThemeButton
                      key={t.name}
                      theme={t}
                      active={theme.name === t.name}
                      onClick={() => setTheme(t)}
                    />
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="switch-container">
                  <span className="section-title" style={{ margin: 0 }}>
                    性能监控
                  </span>
                  <div
                    className={`switch ${performanceMonitoring ? 'on' : ''}`}
                    onClick={() => setPerformanceMonitoring(!performanceMonitoring)}
                  >
                    <div className="switch-thumb" />
                  </div>
                </div>
              </div>

              {stats.isTesting && (
                <div className="section" style={{ background: '#1c2128', padding: 12, borderRadius: 6 }}>
                  <div className="section-title" style={{ color: '#ffcc00' }}>
                    ⏱ 性能测试进行中
                  </div>
                  <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.8 }}>
                    <div>当前FPS: <span style={{ color: '#00ff88' }}>{stats.currentFps}</span></div>
                    <div>平均FPS: <span style={{ color: '#00ff88' }}>{stats.averageFps}</span></div>
                    <div>最低FPS: <span style={{ color: '#ff6b6b' }}>{stats.minFps}</span></div>
                    <div>掉帧次数: <span style={{ color: '#ff6b6b' }}>{stats.droppedFrames}</span></div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="canvas-area">
          <div className="canvas-wrapper">
            <BulletCanvas />
          </div>
        </div>
      </div>
    </div>
  );
}
