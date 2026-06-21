import React, { useState, useRef, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import ParticleScene from './components/ParticleScene';
import {
  ParticleParams,
  ForceFieldParams,
  RenderParams,
  DEFAULT_PARTICLE_PARAMS,
  DEFAULT_FORCE_FIELD_PARAMS,
  DEFAULT_RENDER_PARAMS,
} from './types';

const App: React.FC = () => {
  const [particleParams, setParticleParams] = useState<ParticleParams>(
    DEFAULT_PARTICLE_PARAMS
  );
  const [forceFieldParams, setForceFieldParams] = useState<ForceFieldParams>(
    DEFAULT_FORCE_FIELD_PARAMS
  );
  const [renderParams, setRenderParams] = useState<RenderParams>(
    DEFAULT_RENDER_PARAMS
  );
  const [resetSignal, setResetSignal] = useState(0);
  const [resetAnimating, setResetAnimating] = useState(false);
  const [fps, setFps] = useState(60);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleResetCamera = useCallback(() => {
    setResetAnimating(true);
    setResetSignal((s) => s + 1);
    setTimeout(() => setResetAnimating(false), 600);
  }, []);

  const handleExportScreenshot = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `fluid-particles-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('截图导出失败:', err);
    }
  }, []);

  return (
    <div className="app-root">
      <header className="toolbar">
        <div className="toolbar-title">
          <span className="toolbar-title-icon" />
          <span>流体粒子模拟器</span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontWeight: 400,
              marginLeft: 4,
            }}
          >
            Fluid Particle Simulator
          </span>
        </div>
        <div className="toolbar-buttons">
          <button
            className={`btn btn-reset ${resetAnimating ? 'animating' : ''}`}
            onClick={handleResetCamera}
            title="重置视角"
          >
            <span className="btn-icon">⟳</span>
            <span>重置视角</span>
          </button>
          <button
            className="btn btn-export"
            onClick={handleExportScreenshot}
            title="导出当前帧为PNG"
          >
            <span className="btn-icon">⬇</span>
            <span>导出PNG</span>
          </button>
        </div>
      </header>

      <div className="main-content">
        <ControlPanel
          particleParams={particleParams}
          forceFieldParams={forceFieldParams}
          renderParams={renderParams}
          onParticleChange={setParticleParams}
          onForceFieldChange={setForceFieldParams}
          onRenderChange={setRenderParams}
        />

        <div className="scene-container">
          <div className="canvas-wrapper">
            <ParticleScene
              particleParams={particleParams}
              forceFieldParams={forceFieldParams}
              renderParams={renderParams}
              resetSignal={resetSignal}
              canvasRef={canvasRef}
              onFpsUpdate={setFps}
            />
          </div>
          <div className="fps-counter">
            {fps} FPS · {particleParams.count} 粒子
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
