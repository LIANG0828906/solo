import React, { useRef, useEffect, useCallback } from 'react';

interface WaveformDisplayProps {
  audioEngine: any;
  waveColor?: string;
  spectrumColorStart?: string;
  spectrumColorEnd?: string;
  backgroundColor?: string;
  gridColor?: string;
  showWaveform?: boolean;
  showSpectrum?: boolean;
  isActive?: boolean;
  buffer?: AudioBuffer | null;
  height?: number;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  audioEngine,
  waveColor = '#00E5FF',
  spectrumColorStart = '#1E90FF',
  spectrumColorEnd = '#8A2BE2',
  backgroundColor = '#0D1117',
  gridColor = '#2D3748',
  showWaveform = true,
  showSpectrum = true,
  isActive = true,
  buffer = null,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const spectrumValuesRef = useRef<number[]>(new Array(128).fill(0));
  const lastTimeRef = useRef<number>(0);

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
    const bufferLength = dataArray.length;
    const sliceWidth = width / bufferLength;
    
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = x - sliceWidth;
        const prevV = dataArray[i - 1] / 128.0;
        const prevY = (prevV * height) / 2;
        const cpX = prevX + sliceWidth / 2;
        ctx.quadraticCurveTo(cpX, prevY, x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.globalAlpha = 1;
    ctx.stroke();
    
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = height - (v * height) / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = x - sliceWidth;
        const prevV = dataArray[i - 1] / 128.0;
        const prevY = height - (prevV * height) / 2;
        const cpX = prevX + sliceWidth / 2;
        ctx.quadraticCurveTo(cpX, prevY, x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [waveColor]);

  const drawSpectrum = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, deltaTime: number) => {
    const barCount = 128;
    const barWidth = width / barCount - 2;
    const gap = 2;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, spectrumColorEnd);
    gradient.addColorStop(1, spectrumColorStart);
    
    const easeOut = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor(i * (dataArray.length / barCount));
      const targetValue = dataArray[dataIndex] / 255;
      const currentValue = spectrumValuesRef.current[i] || 0;
      
      const lerpFactor = Math.min(1, deltaTime * 8);
      const newValue = currentValue + (targetValue - currentValue) * easeOut(lerpFactor);
      spectrumValuesRef.current[i] = newValue;
      
      const barHeight = newValue * height;
      const x = i * (barWidth + gap) + gap / 2;
      const y = height - barHeight;
      
      const barGradient = ctx.createLinearGradient(x, y, x, height);
      const hue = 210 + (i / barCount) * 60;
      barGradient.addColorStop(0, `hsl(${hue}, 85%, 65%)`);
      barGradient.addColorStop(1, `hsl(${hue + 30}, 85%, 45%)`);
      
      ctx.fillStyle = barGradient;
      
      const radius = Math.min(barWidth / 2, 6);
      
      if (barHeight > radius * 2) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight);
        ctx.lineTo(x, y + barHeight);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();
      } else if (barHeight > 0) {
        ctx.beginPath();
        ctx.ellipse(x + barWidth / 2, y + barHeight / 2, barWidth / 2, barHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [spectrumColorStart, spectrumColorEnd]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    const rows = 4;
    const cols = 8;
    
    for (let i = 0; i <= rows; i++) {
      const y = (height / rows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    for (let i = 0; i <= cols; i++) {
      const x = (width / cols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [gridColor]);

  const drawStaticWaveform = useCallback((ctx: CanvasRenderingContext2D, audioBuffer: AudioBuffer, width: number, height: number) => {
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / width);
    
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = height / 2;
    
    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, channelData.length);
      
      let min = 1;
      let max = -1;
      
      for (let i = startSample; i < endSample; i++) {
        const sample = channelData[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      const yMin = centerY + min * (height / 2) * 0.8;
      const yMax = centerY + max * (height / 2) * 0.8;
      
      if (x === 0) {
        ctx.moveTo(x, yMin);
      } else {
        ctx.lineTo(x, yMin);
      }
    }
    
    for (let x = width - 1; x >= 0; x--) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, channelData.length);
      
      let min = 1;
      let max = -1;
      
      for (let i = startSample; i < endSample; i++) {
        const sample = channelData[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      const yMin = centerY + min * (height / 2) * 0.8;
      const yMax = centerY + max * (height / 2) * 0.8;
      
      ctx.lineTo(x, yMax);
    }
    
    ctx.closePath();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = waveColor;
    ctx.fill();
    ctx.globalAlpha = 1;
  }, [waveColor]);

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    
    const width = rect.width;
    const height = rect.height;
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = timestamp;
    
    if (buffer) {
      drawStaticWaveform(ctx, buffer, width, height);
    } else if (isActive && audioEngine) {
      if (showSpectrum) {
        const frequencyData = audioEngine.getFrequencyData();
        drawGrid(ctx, width, height);
        drawSpectrum(ctx, frequencyData, width, height, deltaTime);
      }
      
      if (showWaveform) {
        const timeData = audioEngine.getTimeDomainDataByte();
        drawWaveform(ctx, timeData, width, height);
      }
    } else {
      drawGrid(ctx, width, height);
    }
    
    if (isActive && audioEngine) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [audioEngine, backgroundColor, showWaveform, showSpectrum, isActive, buffer, drawWaveform, drawSpectrum, drawGrid, drawStaticWaveform]);

  useEffect(() => {
    if (isActive && audioEngine) {
      animationRef.current = requestAnimationFrame(draw);
    } else if (buffer) {
      animationRef.current = requestAnimationFrame(draw);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, audioEngine, buffer, draw]);

  useEffect(() => {
    if (!isActive && !buffer && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
        }
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, rect.width, rect.height);
        drawGrid(ctx, rect.width, rect.height);
      }
    }
  }, [isActive, buffer, backgroundColor, drawGrid]);

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: height ? `${height}px` : '100%',
        position: 'relative',
        backgroundColor,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #2D3748',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
};

export default WaveformDisplay;
