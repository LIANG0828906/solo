import { useState, useRef, useEffect, useCallback } from 'react';
import { EmitterEngine } from './EmitterEngine';
import { presets, PresetKey } from './presets';
import ParamPanel from './ParamPanel';
import type { EffectParams } from './types';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';

export default function App() {
  const [params, setParams] = useState<EffectParams>(presets['斩击刀光']);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentPreset, setCurrentPreset] = useState<PresetKey>('斩击刀光');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EmitterEngine | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    engineRef.current = new EmitterEngine(canvas);
    engineRef.current.setParams(params);
    if (isPlaying) {
      engineRef.current.start();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setParams(params);
    }
  }, [params]);

  useEffect(() => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.start();
    } else {
      engineRef.current.stop();
    }
  }, [isPlaying]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(params, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `effect-preset-${currentPreset}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [params, currentPreset]);

  const handlePresetChange = useCallback((presetKey: string) => {
    const key = presetKey as PresetKey;
    setCurrentPreset(key);
    setParams(presets[key]);
    if (engineRef.current) {
      engineRef.current.reset();
    }
  }, []);

  const handleParamChange = useCallback((updates: Partial<EffectParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  }, []);

  const handlePlayToggle = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleReset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
    }
  }, []);

  const isMobile = windowWidth < 900;

  return (
    <div className="app-container">
      <div className={`main-layout ${isMobile ? 'mobile' : ''}`}>
        {isMobile && (
          <button
            className="panel-toggle glassmorphism"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
          >
            <Settings size={20} />
            <span>参数面板</span>
            {isPanelOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}

        <div className={`param-panel-wrapper ${isMobile ? (isPanelOpen ? 'open' : 'closed') : ''}`}>
          <ParamPanel
            params={params}
            onChange={handleParamChange}
            preset={currentPreset}
            onPresetChange={handlePresetChange}
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
            onReset={handleReset}
            onExport={handleExport}
          />
        </div>

        <div className="canvas-container">
          <canvas ref={canvasRef} className="effect-canvas" />
        </div>
      </div>
    </div>
  );
}
