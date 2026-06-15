import { useRef, useEffect, useState, useCallback } from 'react';

interface WaveformDisplayProps {
  audioUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  analyserNode?: AnalyserNode | null;
  audioBuffer?: AudioBuffer | null;
}

export default function WaveformDisplay({
  isPlaying,
  currentTime,
  duration,
  onSeek,
  analyserNode,
  audioBuffer,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    time: number;
    intensity: number;
  } | null>(null);
  const bufferDataRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (audioBuffer) {
      const channelData = audioBuffer.getChannelData(0);
      const samples = 256;
      const step = Math.floor(channelData.length / samples);
      const data = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += Math.abs(channelData[i * step + j]);
        }
        data[i] = sum / step;
      }
      bufferDataRef.current = data;
    } else {
      bufferDataRef.current = null;
    }
  }, [audioBuffer]);

  const drawStaticWaveform = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number) => {
      ctx.clearRect(0, 0, width, height);
      const data = bufferDataRef.current;
      if (!data) return;

      const barCount = data.length;
      const barWidth = (width / dpr) / barCount;
      const midY = (height / dpr) / 2;

      for (let i = 0; i < barCount; i++) {
        const barHeight = data[i] * midY * 1.6;
        const x = i * barWidth;
        const gradient = ctx.createLinearGradient(0, midY - barHeight, 0, midY + barHeight);
        gradient.addColorStop(0, '#0a1128');
        gradient.addColorStop(0.5, '#7b2ff7');
        gradient.addColorStop(1, '#0a1128');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, midY - barHeight, barWidth - 1, barHeight * 2);
      }

      if (duration > 0) {
        const progress = currentTime / duration;
        const progressX = progress * (width / dpr);
        ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
        ctx.fillRect(0, 0, progressX, height / dpr);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(progressX, 0);
        ctx.lineTo(progressX, height / dpr);
        ctx.stroke();
      }
    },
    [currentTime, duration]
  );

  const drawLiveWaveform = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number) => {
      if (!analyserNode) return;

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      const barCount = Math.min(bufferLength, 256);
      const barWidth = (width / dpr) / barCount;
      const midY = (height / dpr) / 2;

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i] / 255;
        const barHeight = value * midY * 1.8;
        const x = i * barWidth;
        const gradient = ctx.createLinearGradient(0, midY - barHeight, 0, midY + barHeight);
        gradient.addColorStop(0, '#0a1128');
        gradient.addColorStop(0.5, '#7b2ff7');
        gradient.addColorStop(1, '#0a1128');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, midY - barHeight, barWidth - 1, barHeight * 2);
      }

      if (duration > 0) {
        const progress = currentTime / duration;
        const progressX = progress * (width / dpr);
        ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
        ctx.fillRect(0, 0, progressX, height / dpr);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(progressX, 0);
        ctx.lineTo(progressX, height / dpr);
        ctx.stroke();
      }
    },
    [analyserNode, currentTime, duration]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = '200px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const render = () => {
      if (isPlaying && analyserNode) {
        drawLiveWaveform(ctx, canvas.width, canvas.height, dpr);
      } else {
        drawStaticWaveform(ctx, canvas.width, canvas.height, dpr);
      }
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, analyserNode, drawLiveWaveform, drawStaticWaveform]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 200 * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = '200px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCanvasCoords(e);
      const canvas = canvasRef.current;
      if (!canvas || duration <= 0) {
        setHoverInfo(null);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const time = (x / rect.width) * duration;
      let intensity = 0;
      if (analyserNode && isPlaying) {
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);
        const idx = Math.floor((x / rect.width) * dataArray.length);
        intensity = idx < dataArray.length ? dataArray[idx] : 0;
      } else if (bufferDataRef.current) {
        const data = bufferDataRef.current;
        const idx = Math.floor((x / rect.width) * data.length);
        intensity = idx < data.length ? Math.round(data[idx] * 255) : 0;
      }
      setHoverInfo({ x, y, time, intensity });
    },
    [getCanvasCoords, duration, analyserNode, isPlaying]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || duration <= 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / rect.width) * duration;
      onSeek(time);
    },
    [duration, onSeek]
  );

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden bg-card">
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair"
        style={{ height: '200px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      {hoverInfo && (
        <div
          className="absolute pointer-events-none z-10 bg-bg/90 border border-accent/50 rounded px-2 py-1 font-body text-xs text-accent-hover"
          style={{
            left: `${hoverInfo.x + 12}px`,
            top: `${hoverInfo.y - 28}px`,
          }}
        >
          <div>{formatTime(hoverInfo.time)}</div>
          <div>Intensity: {hoverInfo.intensity}</div>
        </div>
      )}
      {hoverInfo && (
        <div
          className="absolute top-0 bottom-0 w-px bg-accent/40 pointer-events-none"
          style={{ left: `${hoverInfo.x}px` }}
        />
      )}
    </div>
  );
}
