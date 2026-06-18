import { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  waveData: number[];
  volume: number;
  muted: boolean;
  isPlaying: boolean;
  masterVolume: number;
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  waveData,
  volume,
  muted,
  isPlaying,
  masterVolume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const dataLength = waveData.length;
      if (dataLength === 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const effectiveVolume = muted ? 0 : (volume / 100) * (masterVolume / 100);
      const samplesPerPixel = Math.max(1, Math.floor(dataLength / width));

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#00E5FF');
      gradient.addColorStop(1, '#7C4DFF');

      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.85;

      phaseRef.current += isPlaying ? 0.02 : 0.002;

      for (let x = 0; x < width; x++) {
        const startSample = x * samplesPerPixel;
        const endSample = Math.min(startSample + samplesPerPixel, dataLength);

        let sum = 0;
        let min = 1;
        let max = -1;

        for (let i = startSample; i < endSample; i++) {
          const animate = isPlaying
            ? Math.sin(phaseRef.current + i * 0.01) * 0.15
            : 0;
          const val = waveData[i] * effectiveVolume + animate;
          sum += val;
          if (val < min) min = val;
          if (val > max) max = val;
        }

        const avg = sum / (endSample - startSample);
        const barHeight = (max - min) * (height * 0.45);
        const barCenter = centerY + avg * height * 0.3;
        const barTop = Math.max(2, barCenter - barHeight / 2);
        const barBottom = Math.min(height - 2, barCenter + barHeight / 2);

        ctx.fillRect(x, barTop, 1, barBottom - barTop || 1);
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(draw);
    };

    let frameCount = 0;
    const throttledDraw = () => {
      frameCount++;
      if (frameCount % 2 === 0) {
        draw();
      } else {
        animationRef.current = requestAnimationFrame(throttledDraw);
      }
    };

    animationRef.current = requestAnimationFrame(throttledDraw);

    return () => {
      ro.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveData, volume, muted, isPlaying, masterVolume]);

  return <canvas ref={canvasRef} className="waveform-canvas" />;
};

export default WaveformCanvas;
