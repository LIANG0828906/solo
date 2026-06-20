import { useEffect, useRef } from 'react';
import { useMixerStore } from '@/store/useMixerStore';
import { waveformRenderer } from '@/renderer/waveformRenderer';
import { audioEngine } from '@/engine/audioEngine';

export default function WaveformDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isEngineInitialized = useMixerStore((s) => s.isEngineInitialized);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initWaveform = () => {
      const analyser = audioEngine.getAnalyser();
      if (analyser && canvas) {
        waveformRenderer.init(canvas, analyser);
        waveformRenderer.start();
      }
    };

    if (isEngineInitialized) {
      initWaveform();
    }

    const interval = setInterval(() => {
      if (!isEngineInitialized) {
        const store = useMixerStore.getState();
        if (store.isEngineInitialized) {
          initWaveform();
          clearInterval(interval);
        }
      }
    }, 200);

    const handleResize = () => {
      if (canvas) {
        waveformRenderer.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      waveformRenderer.destroy();
    };
  }, [isEngineInitialized]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0F0F23';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = '#3D3D5C';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rect.height / 2);
    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#4B5563';
    ctx.textAlign = 'center';
    ctx.fillText('等待播放...', rect.width / 2, rect.height / 2 + 4);
  }, []);

  return (
    <div className="waveform-container" style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 200,
          display: 'block',
          background: '#0F0F23',
        }}
      />
    </div>
  );
}
