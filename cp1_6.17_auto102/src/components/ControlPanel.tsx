import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { BandParams, spectrumEngine, WaveformData } from '../SpectrumEngine';
import '../index.css';

interface BandSliderProps {
  label: string;
  band: keyof BandParams;
  param: 'frequency' | 'intensity' | 'phase';
  min: number;
  max: number;
  value: number;
  onChange: (band: keyof BandParams, param: 'frequency' | 'intensity' | 'phase', value: number) => void;
}

function BandSlider({ label, band, param, min, max, value, onChange }: BandSliderProps) {
  return (
    <div className="slider-container">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={param === 'phase' ? 1 : 0.1}
        value={value}
        onChange={(e) => onChange(band, param, parseFloat(e.target.value))}
        className="custom-slider"
      />
    </div>
  );
}

export function ControlPanel() {
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const scrollOffsetRef = useRef<number>(0);
  const waveformDataRef = useRef<WaveformData | null>(null);

  const bandParams = useGameStore((state) => state.bandParams);
  const setBandParams = useGameStore((state) => state.setBandParams);
  const setWaveformData = useGameStore((state) => state.setWaveformData);

  const handleSliderChange = useCallback(
    (band: keyof BandParams, param: 'frequency' | 'intensity' | 'phase', value: number) => {
      const newParams: Partial<BandParams> = {
        [band]: { ...bandParams[band], [param]: value },
      };
      setBandParams(newParams);
      spectrumEngine.setParams(newParams);
    },
    [bandParams, setBandParams]
  );

  const interpolateColor = useCallback((factor: number): string => {
    const r1 = 0, g1 = 255, b1 = 136;
    const r2 = 0, g2 = 191, b2 = 255;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  const interpolateSpectrumColor = useCallback((factor: number): string => {
    const r1 = 75, g1 = 0, b1 = 130;
    const r2 = 255, g2 = 140, b2 = 0;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = waveformDataRef.current;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#1A2332';
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    for (let i = 0; i < width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    if (!data) return;

    const points = data.points;
    const centerY = height / 2;
    const amplitude = height / 4;

    scrollOffsetRef.current += 0.5;
    if (scrollOffsetRef.current >= width) {
      scrollOffsetRef.current = 0;
    }

    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < points.length; i++) {
      const x = (i / points.length) * width - scrollOffsetRef.current;
      const xWrapped = x < 0 ? x + width : x;
      const y = centerY + points[i] * amplitude;

      const colorFactor = i / points.length;
      ctx.strokeStyle = interpolateColor(colorFactor);

      if (i === 0) {
        ctx.moveTo(xWrapped, y);
      } else {
        ctx.lineTo(xWrapped, y);
      }

      if ((i + 1) % 10 === 0) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xWrapped, y);
      }
    }
    ctx.stroke();
  }, [interpolateColor]);

  const drawSpectrum = useCallback(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = waveformDataRef.current;

    ctx.clearRect(0, 0, width, height);

    if (!data) return;

    const spectrum = data.spectrum;
    const barWidth = 6;
    const gap = 2;
    const totalBars = Math.min(spectrum.length, Math.floor(width / (barWidth + gap)));
    const startX = (width - totalBars * (barWidth + gap)) / 2;

    for (let i = 0; i < totalBars; i++) {
      const barHeight = spectrum[i] * (height - 10);
      const x = startX + i * (barWidth + gap);
      const y = height - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, interpolateSpectrumColor(i / totalBars));
      gradient.addColorStop(1, interpolateSpectrumColor((i / totalBars) * 0.5));

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [interpolateSpectrumColor]);

  const animate = useCallback(() => {
    const data = spectrumEngine.generateWaveform();
    waveformDataRef.current = data;
    setWaveformData(data);

    drawWaveform();
    drawSpectrum();

    animationRef.current = requestAnimationFrame(animate);
  }, [drawWaveform, drawSpectrum, setWaveformData]);

  useEffect(() => {
    const updateCanvasSize = () => {
      const waveformCanvas = waveformCanvasRef.current;
      const spectrumCanvas = spectrumCanvasRef.current;

      if (waveformCanvas) {
        const parent = waveformCanvas.parentElement;
        if (parent) {
          waveformCanvas.width = parent.clientWidth;
          waveformCanvas.height = 120;
        }
      }

      if (spectrumCanvas) {
        const parent = spectrumCanvas.parentElement;
        if (parent) {
          spectrumCanvas.width = parent.clientWidth;
          spectrumCanvas.height = 80;
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    spectrumEngine.setParams(bandParams);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, bandParams]);

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h3>频谱控制</h3>
      </div>

      <div className="band-section">
        <div className="band-title low">低频段 (1-10Hz)</div>
        <BandSlider
          label="频率"
          band="low"
          param="frequency"
          min={1}
          max={10}
          value={bandParams.low.frequency}
          onChange={handleSliderChange}
        />
        <BandSlider
          label="强度"
          band="low"
          param="intensity"
          min={0}
          max={100}
          value={bandParams.low.intensity}
          onChange={handleSliderChange}
        />
        <BandSlider
          label="相位"
          band="low"
          param="phase"
          min={0}
          max={360}
          value={bandParams.low.phase}
          onChange={handleSliderChange}
        />
      </div>

      <div className="band-section">
        <div className="band-title mid">中频段 (10-50Hz)</div>
        <BandSlider
          label="频率"
          band="mid"
          param="frequency"
          min={10}
          max={50}
          value={bandParams.mid.frequency}
          onChange={handleSliderChange}
        />
        <BandSlider
          label="强度"
          band="mid"
          param="intensity"
          min={0}
          max={100}
          value={bandParams.mid.intensity}
          onChange={handleSliderChange}
        />
        <BandSlider
          label="相位"
          band="mid"
          param="phase"
          min={0}
          max={360}
          value={bandParams.mid.phase}
          onChange={handleSliderChange}
        />
      </div>

      <div className="band-section">
        <div className="band-title high">高频段 (50-100Hz)</div>
        <BandSlider
          label="频率"
          band="high"
          param="frequency"
          min={50}
          max={100}
          value={bandParams.high.frequency}
          onChange={handleSliderChange}
        />
        <BandSlider
          label="强度"
          band="high"
          param="intensity"
          min={0}
          max={100}
          value={bandParams.high.intensity}
          onChange={handleSliderChange}
        />
        <BandSlider
          label="相位"
          band="high"
          param="phase"
          min={0}
          max={360}
          value={bandParams.high.phase}
          onChange={handleSliderChange}
        />
      </div>

      <div className="waveform-container">
        <div className="waveform-label">波形预览</div>
        <canvas ref={waveformCanvasRef} className="waveform-canvas" />
      </div>

      <div className="spectrum-container">
        <div className="waveform-label">频谱分析</div>
        <canvas ref={spectrumCanvasRef} className="spectrum-canvas" />
      </div>
    </div>
  );
}
