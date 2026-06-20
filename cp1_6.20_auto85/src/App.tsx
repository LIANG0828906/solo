import { useEffect, useRef, useState, useCallback } from 'react';
import { NebulaCanvas } from './components/NebulaCanvas';
import { ControlPanel } from './components/ControlPanel';
import type { NebulaParams, Morphology, NebulaPreset } from './types';
import { DEFAULT_PARAMS } from './types';
import builtinPresets from './utils/nebulaPresets.json';

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const nebulaCanvasRef = useRef<NebulaCanvas | null>(null);
  const [params, setParams] = useState<NebulaParams>(DEFAULT_PARAMS);
  const [presets, setPresets] = useState<NebulaPreset[]>(builtinPresets as NebulaPreset[]);

  useEffect(() => {
    if (canvasRef.current && !nebulaCanvasRef.current) {
      nebulaCanvasRef.current = new NebulaCanvas(canvasRef.current, DEFAULT_PARAMS);
    }
    return () => {
      if (nebulaCanvasRef.current) {
        nebulaCanvasRef.current.dispose();
        nebulaCanvasRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fetch('/api/presets')
      .then(res => res.json())
      .then(data => {
        if (data.presets) {
          setPresets(data.presets);
        }
      })
      .catch(() => {
        setPresets(builtinPresets as NebulaPreset[]);
      });
  }, []);

  const handleParamChange = useCallback((key: keyof NebulaParams, value: number | Morphology) => {
    setParams(prev => {
      const next = { ...prev, [key]: value } as NebulaParams;
      if (nebulaCanvasRef.current) {
        nebulaCanvasRef.current.updateParams({ [key]: value } as Partial<NebulaParams>);
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    if (nebulaCanvasRef.current) {
      nebulaCanvasRef.current.updateParams(DEFAULT_PARAMS);
    }
  }, []);

  const handleSavePreset = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, params }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPresets(prev => [...prev, data.preset]);
        }
      }
    } catch (e) {
      console.warn('Failed to save preset to server');
    }
  }, [params]);

  const handleLoadPreset = useCallback((preset: NebulaPreset) => {
    setParams(preset.params);
    if (nebulaCanvasRef.current) {
      nebulaCanvasRef.current.updateParams(preset.params);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 3,
            color: 'rgba(165, 180, 252, 0.6)',
            margin: 0,
            textShadow: '0 0 10px rgba(99,102,241,0.3)',
          }}
        >
          NEBULA · PARTICLE SYSTEM
        </h1>
      </div>
      <ControlPanel
        params={params}
        presets={presets}
        onParamChange={handleParamChange}
        onReset={handleReset}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
      />
    </div>
  );
}

export default App;
