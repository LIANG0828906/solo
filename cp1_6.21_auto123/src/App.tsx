import React, { useEffect, useRef, useState, useCallback } from 'react';
import ControlPanel from './controls/ControlPanel';
import { FlowRenderer, FlowParams } from './animation/FlowRenderer';
import { PresetParams, savePreset } from './api/presetApi';

const DEFAULT_PARAMS: PresetParams = {
  density: 40,
  speed: 1.0,
  hue: 240,
  opacity: 0.7,
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FlowRenderer | null>(null);
  const [params, setParams] = useState<PresetParams>(DEFAULT_PARAMS);
  const [fps, setFps] = useState(60);
  const [lowPerformance, setLowPerformance] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [triggerSave, setTriggerSave] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new FlowRenderer(canvasRef.current);
    rendererRef.current = renderer;
    renderer.setOnFpsUpdate((currentFps, isLowPerf) => {
      setFps(currentFps);
      setLowPerformance(isLowPerf);
    });
    renderer.start();
    return () => {
      renderer.stop();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateParams(params as FlowParams);
    }
  }, [params]);

  useEffect(() => {
    if (triggerSave) {
      setModalOpen(true);
      setPresetName('');
      setTriggerSave(false);
    }
  }, [triggerSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) {
        if (e.key === 'Escape') {
          setModalOpen(false);
        }
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        handleRandomize();
      } else if (e.key === 's' || e.key === 'S') {
        setTriggerSave(true);
      } else if (e.key === 'Escape') {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const handleRandomize = useCallback(() => {
    setParams({
      density: Math.round(10 + Math.random() * 90),
      speed: Math.round((0.5 + Math.random() * 2.5) * 10) / 10,
      hue: Math.round(Math.random() * 360),
      opacity: Math.round((0.1 + Math.random() * 0.9) * 20) / 20,
    });
  }, []);

  const handleSavePreset = useCallback(async () => {
    if (!presetName.trim()) return;
    try {
      await savePreset(presetName.trim(), params);
      setModalOpen(false);
      setPresetName('');
    } catch (e) {
      console.error('保存预设失败:', e);
    }
  }, [presetName, params]);

  const handleOpenSaveModal = useCallback(() => {
    setTriggerSave(true);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: '#0F172A',
        color: '#E2E8F0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <ControlPanel
        params={params}
        onParamsChange={setParams}
        onRandomize={handleRandomize}
        onSavePreset={handleOpenSaveModal}
        fps={fps}
        lowPerformance={lowPerformance}
      />

      <div
        style={{
          flex: 1,
          position: 'relative',
          minWidth: 800,
          minHeight: 500,
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            background: '#0F172A',
            touchAction: 'none',
          }}
        />
      </div>

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: '#1E293B',
              borderRadius: 12,
              width: 400,
              padding: 24,
              animation: 'modalIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#E2E8F0' }}>
              保存预设
            </h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="输入预设名称"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset();
                if (e.key === 'Escape') setModalOpen(false);
              }}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 6,
                background: '#334155',
                border: '2px solid transparent',
                color: '#E2E8F0',
                padding: '0 12px',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s ease-in-out',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: '#334155',
                  color: '#E2E8F0',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'background 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#475569')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#334155')}
              >
                取消
              </button>
              <button
                onClick={handleSavePreset}
                style={{
                  background: '#6366F1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'background 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#4F46E5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
