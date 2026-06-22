import React, { useRef, useEffect } from 'react';
import { AudioEngine } from '@/engine/AudioEngine';

interface WaveformVisualizerProps {
  isInitialized: boolean;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ isInitialized }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioEngine = AudioEngine.getInstance();

    const resizeCanvas = (): void => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = (): void => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const timeData = audioEngine.getTimeDomainData();
      const freqData = audioEngine.getFrequencyData();

      ctx.fillStyle = 'rgba(22, 33, 62, 0.3)';
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(64, 156, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(64, 156, 255, 0.8)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = width / timeData.length;
      let x = 0;

      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const barCount = 64;
      const barWidth = width / barCount - 2;
      const freqStep = Math.floor(freqData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < freqStep; j++) {
          sum += freqData[i * freqStep + j];
        }
        const avg = sum / freqStep;
        const barHeight = (avg / 255) * height * 0.7;
        const barX = i * (barWidth + 2);
        const barY = height - barHeight;

        const barGradient = ctx.createLinearGradient(barX, height, barX, barY);
        barGradient.addColorStop(0, 'rgba(240, 192, 64, 0.6)');
        barGradient.addColorStop(1, 'rgba(255, 220, 100, 0.9)');

        ctx.fillStyle = barGradient;
        ctx.fillRect(barX, barY, barWidth, barHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized]);

  return (
    <div className="waveform-visualizer">
      <canvas ref={canvasRef} className="visualizer-canvas" />
      {!isInitialized && (
        <div className="visualizer-placeholder">
          <p>点击任意位置开始</p>
        </div>
      )}
    </div>
  );
};

export default WaveformVisualizer;
