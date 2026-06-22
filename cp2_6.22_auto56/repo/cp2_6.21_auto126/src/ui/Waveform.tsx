import { useEffect, useRef } from 'react';
import { useStore } from '../data/store';
import { audioEngine } from '../engine/audioEngine';
import { beatScheduler } from '../engine/beatScheduler';

const WAVEFORM_BUFFER_SIZE = 1024;

export const Waveform = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const fadeRef = useRef(1);
  const waveformBufferRef = useRef<Float32Array>(new Float32Array(WAVEFORM_BUFFER_SIZE));
  const bufferWriteIndexRef = useRef(0);
  const lastWaveformUpdateRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  
  const isPlaying = useStore(state => state.isPlaying);
  const isLoadingPreset = useStore(state => state.isLoadingPreset);
  const bpm = useStore(state => state.bpm);
  const isPlayingRef = useRef(isPlaying);
  const isLoadingPresetRef = useRef(isLoadingPreset);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isLoadingPresetRef.current = isLoadingPreset;
  }, [isLoadingPreset]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    const draw = (timestamp: number) => {
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

      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

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
          
          const samplesToAdd = Math.min(engineData.length, 64);
          for (let i = 0; i < samplesToAdd; i++) {
            const avgSample = engineData[i % engineData.length];
            waveformBufferRef.current[bufferWriteIndexRef.current] = avgSample;
            bufferWriteIndexRef.current = (bufferWriteIndexRef.current + 1) % WAVEFORM_BUFFER_SIZE;
          }
          
          lastWaveformUpdateRef.current = now;
        }
      }

      const fadeTarget = isLoadingPresetRef.current ? 0 : 1;
      const fadeSpeed = 0.02;
      if (fadeRef.current < fadeTarget) {
        fadeRef.current = Math.min(fadeRef.current + fadeSpeed, fadeTarget);
      } else if (fadeRef.current > fadeTarget) {
        fadeRef.current = Math.max(fadeRef.current - fadeSpeed, fadeTarget);
      }
      const alpha = fadeRef.current;

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(0, 180, 216, ${alpha})`);
      gradient.addColorStop(0.3, `rgba(114, 9, 183, ${alpha})`);
      gradient.addColorStop(0.6, `rgba(0, 180, 216, ${alpha})`);
      gradient.addColorStop(1, `rgba(114, 9, 183, ${alpha})`);

      const buffer = waveformBufferRef.current;
      const bufferSize = buffer.length;
      const writeIndex = bufferWriteIndexRef.current;

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;

      for (let i = 0; i < width; i++) {
        const bufferPos = Math.floor((i / width) * bufferSize);
        const readIndex = (writeIndex + bufferPos) % bufferSize;
        const v = buffer[readIndex] * 1.5;
        const y = height / 2 + v * height * 0.35;
        
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(0, 180, 216, ${0.25 * alpha})`;
      ctx.lineWidth = 5;
      for (let i = 0; i < width; i++) {
        const bufferPos = Math.floor((i / width) * bufferSize);
        const readIndex = (writeIndex + bufferPos) % bufferSize;
        const v = buffer[readIndex] * 1.5;
        const y = height / 2 + v * height * 0.35;
        
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();

      const freqGradient = ctx.createLinearGradient(0, 0, 0, height);
      freqGradient.addColorStop(0, `rgba(0, 180, 216, ${0.08 * alpha})`);
      freqGradient.addColorStop(0.5, `rgba(114, 9, 183, ${0.15 * alpha})`);
      freqGradient.addColorStop(1, `rgba(0, 180, 216, ${0.08 * alpha})`);

      ctx.fillStyle = freqGradient;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let i = 0; i < width; i++) {
        const bufferPos = Math.floor((i / width) * bufferSize);
        const readIndex = (writeIndex + bufferPos) % bufferSize;
        const v = buffer[readIndex] * 1.5;
        const y = height / 2 + v * height * 0.35;
        ctx.lineTo(i, y);
      }
      ctx.lineTo(width, height / 2);
      ctx.closePath();
      ctx.fill();

      const centerX = width * 0.7;
      const progressGradient = ctx.createLinearGradient(centerX - 2, 0, centerX + 2, 0);
      progressGradient.addColorStop(0, 'rgba(0, 180, 216, 0)');
      progressGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.8 * alpha})`);
      progressGradient.addColorStop(1, 'rgba(0, 180, 216, 0)');
      
      ctx.fillStyle = progressGradient;
      ctx.fillRect(centerX - 3, 0, 6, height);

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
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
