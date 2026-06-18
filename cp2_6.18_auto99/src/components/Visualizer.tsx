import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '../store/audioStore';
import { ParticleEngine } from '../utils/particleEngine';

export function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleEngineRef = useRef<ParticleEngine>(new ParticleEngine());
  const animationRef = useRef<number>(0);
  const lastBeatRef = useRef<number>(0);
  const lastBeatTimeActualRef = useRef<number>(0);
  const [bpmDisplay, setBpmDisplay] = useState<number>(0);

  const frequencyBands = useAudioStore((state) => state.frequencyBands);
  const bpm = useAudioStore((state) => state.bpm);
  const isLoaded = useAudioStore((state) => state.isLoaded);
  const isPlaying = useAudioStore((state) => state.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const particleEngine = particleEngineRef.current;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particleEngine.setCanvasSize(rect.width, rect.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const renderLoop = (timestamp: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      if (isLoaded && isPlaying) {
        const { low, mid, high } = frequencyBands;
        particleEngine.spawnParticles(low, mid, high);

        if (bpm > 0) {
          const beatInterval = 60000 / bpm;
          if (timestamp - lastBeatTimeActualRef.current >= beatInterval) {
            particleEngine.triggerBeat();
            lastBeatTimeActualRef.current = timestamp;
          }
        }

        if (bpm !== lastBeatRef.current) {
          setBpmDisplay(bpm);
          lastBeatRef.current = bpm;
        }
      }

      particleEngine.update(timestamp);
      particleEngine.render(ctx, timestamp);

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    animationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      particleEngine.clear();
    };
  }, [frequencyBands, bpm, isLoaded, isPlaying]);

  return (
    <>
      <canvas ref={canvasRef} className="visualizer-canvas" />
      {isLoaded && bpmDisplay > 0 && (
        <div className="bpm-display">BPM: {bpmDisplay}</div>
      )}
    </>
  );
}
