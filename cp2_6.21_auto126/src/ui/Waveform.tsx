import { useEffect, useRef } from 'react';
import { useStore } from '../data/store';
import { audioEngine } from '../engine/audioEngine';

export const Waveform = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const fadeRef = useRef(1);
  const scrollOffsetRef = useRef(0);
  const waveformDataRef = useRef<Float32Array>(new Float32Array(2048));
  const lastWaveformUpdateRef = useRef(0);
  
  const isPlaying = useStore(state => state.isPlaying);
  const isLoadingPreset = useStore(state => state.isLoadingPreset);
  const isPlayingRef = useRef(isPlaying);
  const isLoadingPresetRef = useRef(isLoadingPreset);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isLoadingPresetRef.current = isLoadingPreset;
  }, [isLoadingPreset]);

  useEffect(() => {
    let lastScrollUpdate = 0;
    
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#0f3460';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const now = performance.now();
      if (isPlayingRef.current) {
        if (now - lastWaveformUpdateRef.current >= 1000 / 30) {
          const engineData = audioEngine.getWaveform();
          waveformDataRef.current = new Float32Array(engineData);
          lastWaveformUpdateRef.current = now;
        }
        
        if (now - lastScrollUpdate > 33) {
          scrollOffsetRef.current = (scrollOffsetRef.current + 2) % width;
          lastScrollUpdate = now;
        }
      }

      const data = waveformDataRef.current;
      const bufferLength = data.length;
      const sliceWidth = width / bufferLength;

      const fadeTarget = isLoadingPresetRef.current ? 0 : 1;
      const fadeSpeed = 0.03;
      if (fadeRef.current < fadeTarget) {
        fadeRef.current = Math.min(fadeRef.current + fadeSpeed, fadeTarget);
      } else if (fadeRef.current > fadeTarget) {
        fadeRef.current = Math.max(fadeRef.current - fadeSpeed, fadeTarget);
      }
      const alpha = fadeRef.current;

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(0, 180, 216, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(114, 9, 183, ${alpha})`);
      gradient.addColorStop(1, `rgba(0, 180, 216, ${alpha})`);

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;

      const scrollOffset = scrollOffsetRef.current;
      for (let i = 0; i < bufferLength; i++) {
        const v = data[i] * 0.8;
        const y = v * height * 0.4 + height / 2;
        const x = (i * sliceWidth + scrollOffset) % width;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(0, 180, 216, ${0.3 * alpha})`;
      ctx.lineWidth = 4;
      for (let i = 0; i < bufferLength; i++) {
        const v = data[i] * 0.8;
        const y = v * height * 0.4 + height / 2;
        const x = (i * sliceWidth + scrollOffset) % width;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      const freqGradient = ctx.createLinearGradient(0, 0, 0, height);
      freqGradient.addColorStop(0, `rgba(0, 180, 216, ${0.1 * alpha})`);
      freqGradient.addColorStop(0.5, `rgba(114, 9, 183, ${0.2 * alpha})`);
      freqGradient.addColorStop(1, `rgba(0, 180, 216, ${0.1 * alpha})`);

      ctx.fillStyle = freqGradient;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let i = 0; i < bufferLength; i++) {
        const v = data[i] * 0.8;
        const y = v * height * 0.4 + height / 2;
        const x = (i * sliceWidth + scrollOffset) % width;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height / 2);
      ctx.closePath();
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="waveform-container">
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
      />
      <div className="waveform-label">波形预览</div>
    </div>
  );
};
