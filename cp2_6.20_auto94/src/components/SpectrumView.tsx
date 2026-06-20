import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore } from '../modules/state/store';
import { WaveformGenerator } from '../modules/waveform/WaveformGenerator';
import { SpectrumAnalyzer, SpectrumBin } from '../modules/spectrum/SpectrumAnalyzer';

export const SpectrumView: React.FC = () => {
  const tracks = useAppStore((s) => s.tracks);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; freq: string; db: string } | null>(null);
  const spectrumDataRef = useRef<SpectrumBin[]>([]);

  const drawSpectrum = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w <= 0 || h <= 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, w, h);

    const mixed = WaveformGenerator.mixTracks(tracks);
    const spectrum = SpectrumAnalyzer.analyze(mixed, 44100);
    spectrumDataRef.current = spectrum;

    const minFreq = 20;
    const maxFreq = 20000;
    const numBars = Math.min(w, 256);
    const barW = Math.max(1, w / numBars - 1);
    const padding = 30;
    const plotH = h - padding;

    const rainbow = (t: number): string => {
      const r = Math.sin(t * Math.PI * 2) * 127 + 128;
      const g = Math.sin(t * Math.PI * 2 + 2.094) * 127 + 128;
      const b = Math.sin(t * Math.PI * 2 + 4.189) * 127 + 128;
      return `rgb(${r},${g},${b})`;
    };

    let maxMag = 0;
    for (const bin of spectrum) {
      if (bin.magnitude > maxMag) maxMag = bin.magnitude;
    }
    if (maxMag === 0) maxMag = 1;

    for (let i = 0; i < numBars; i++) {
      const freqLow = SpectrumAnalyzer.xToFrequency((i / numBars) * w, minFreq, maxFreq, w);
      const freqHigh = SpectrumAnalyzer.xToFrequency(((i + 1) / numBars) * w, minFreq, maxFreq, w);

      let maxBinMag = 0;
      for (const bin of spectrum) {
        if (bin.frequency >= freqLow && bin.frequency < freqHigh) {
          if (bin.magnitude > maxBinMag) maxBinMag = bin.magnitude;
        }
      }

      const db = SpectrumAnalyzer.toDB(maxBinMag);
      const normalized = Math.max(0, (db + 80) / 80);
      const barH = normalized * plotH;

      const x = SpectrumAnalyzer.frequencyToX(freqLow, minFreq, maxFreq, w);
      const grad = ctx.createLinearGradient(x, plotH - barH, x, plotH);
      const t = i / numBars;
      grad.addColorStop(0, rainbow(t));
      grad.addColorStop(1, rainbow(t + 0.1));

      ctx.fillStyle = grad;
      ctx.fillRect(x, plotH - barH, barW, barH);
    }

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, plotH);
    ctx.lineTo(w, plotH);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    const freqLabels = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    for (const f of freqLabels) {
      const x = SpectrumAnalyzer.frequencyToX(f, minFreq, maxFreq, w);
      ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x - 8, h - 8);
      ctx.strokeStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, plotH);
      ctx.stroke();
    }

    const dbLabels = [0, -20, -40, -60, -80];
    for (const db of dbLabels) {
      const normalized = (db + 80) / 80;
      const y = plotH - normalized * plotH;
      ctx.fillStyle = '#444';
      ctx.font = '8px monospace';
      ctx.fillText(`${db}dB`, 2, y - 2);
      ctx.strokeStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, [tracks]);

  useEffect(() => {
    let running = true;
    let lastTime = 0;
    const fps = 30;
    const interval = 1000 / fps;

    const renderLoop = (time: number) => {
      if (!running) return;
      if (time - lastTime >= interval) {
        drawSpectrum();
        lastTime = time;
      }
      animRef.current = requestAnimationFrame(renderLoop);
    };
    animRef.current = requestAnimationFrame(renderLoop);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [drawSpectrum]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const freq = SpectrumAnalyzer.xToFrequency(x, 20, 20000, rect.width);

    let closestBin = spectrumDataRef.current[0];
    let minDist = Infinity;
    for (const bin of spectrumDataRef.current) {
      const dist = Math.abs(bin.frequency - freq);
      if (dist < minDist) {
        minDist = dist;
        closestBin = bin;
      }
    }

    if (closestBin) {
      const db = SpectrumAnalyzer.toDB(closestBin.magnitude);
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        freq: freq >= 1000 ? `${(freq / 1000).toFixed(1)}kHz` : `${freq.toFixed(0)}Hz`,
        db: `${db.toFixed(1)}dB`,
      });
    }
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div style={{
        position: 'absolute', top: 4, left: 6, fontSize: 10, color: '#e0e0e0',
        textShadow: '0 0 4px rgba(255,255,255,0.3)', pointerEvents: 'none',
      }}>
        Spectrum
      </div>
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 28,
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 8,
          fontSize: 11,
          pointerEvents: 'none',
          zIndex: 100,
          whiteSpace: 'nowrap',
        }}>
          {tooltip.freq} / {tooltip.db}
        </div>
      )}
    </div>
  );
};
