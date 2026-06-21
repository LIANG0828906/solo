import { useEffect, useRef, useState } from 'react';
import { CanvasRenderer } from './CanvasRenderer';
import { ControlPanel } from './ControlPanel';
import { COLOR_THEMES } from './types';
import type { WaveformType, ColorTheme } from './types';
import './styles.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  const [waveform, setWaveform] = useState<WaveformType>('sine');
  const [speed, setSpeed] = useState(1);
  const [themeId, setThemeId] = useState<string>(COLOR_THEMES[0].id);
  const [particleCount, setParticleCount] = useState(0);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initialTheme = COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];
    const renderer = new CanvasRenderer(canvasRef.current, initialTheme);
    rendererRef.current = renderer;

    renderer.setStatsCallback((stats) => {
      setParticleCount(stats.particles);
      setFps(stats.fps);
    });

    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.destroy();
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.setWaveform(waveform);
  }, [waveform]);

  useEffect(() => {
    rendererRef.current?.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    const theme = COLOR_THEMES.find((t) => t.id === themeId);
    if (theme) {
      rendererRef.current?.setTheme(theme);
    }
  }, [themeId]);

  const handleThemeChange = (theme: ColorTheme) => {
    setThemeId(theme.id);
  };

  const handlePreviewWaveform = (w: WaveformType) => {
    rendererRef.current?.previewWaveform(w);
  };

  return (
    <div className="app">
      <div className="canvas-container">
        <canvas ref={canvasRef} />
        <div className="canvas-hint">点击画布生成粒子 · 拖拽绘制音乐轨迹</div>
      </div>
      <ControlPanel
        waveform={waveform}
        speed={speed}
        themeId={themeId}
        particleCount={particleCount}
        fps={fps}
        onWaveformChange={setWaveform}
        onSpeedChange={setSpeed}
        onThemeChange={handleThemeChange}
        onPreviewWaveform={handlePreviewWaveform}
      />
    </div>
  );
}

export default App;
