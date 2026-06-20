import { useEffect, useRef } from 'react';
import { generateSpectrumData } from '../utils/blackbody';

interface SpectrumChartProps {
  temperature: number;
  starColor: { r: number; g: number; b: number };
}

export default function SpectrumChart({ temperature, starColor }: SpectrumChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 10, right: 10, bottom: 25, left: 35 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    const spectrumData = generateSpectrumData(temperature, 380, 780, 100);

    if (spectrumData.length === 0) return;

    const starColorHex = `rgb(${Math.round(starColor.r * 255)}, ${Math.round(starColor.g * 255)}, ${Math.round(starColor.b * 255)})`;

    const gradient = ctx.createLinearGradient(padding.left, padding.top, width - padding.right, padding.top);
    for (let i = 0; i < spectrumData.length; i++) {
      const point = spectrumData[i];
      const ratio = i / (spectrumData.length - 1);
      const waveColor = wavelengthToRgbString(point.wavelength);
      gradient.addColorStop(ratio, waveColor);
    }

    ctx.beginPath();
    for (let i = 0; i < spectrumData.length; i++) {
      const point = spectrumData[i];
      const x = padding.left + (i / (spectrumData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - point.intensity * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.lineTo(width - padding.right, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();

    const fillGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    fillGradient.addColorStop(0, starColorHex + 'cc');
    fillGradient.addColorStop(1, starColorHex + '10');
    ctx.fillStyle = fillGradient;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < spectrumData.length; i++) {
      const point = spectrumData[i];
      const x = padding.left + (i / (spectrumData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - point.intensity * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(224, 224, 224, 0.6)';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';

    const wavelengths = [380, 480, 580, 680, 780];
    for (const wl of wavelengths) {
      const x = padding.left + ((wl - 380) / 400) * chartWidth;
      ctx.fillText(`${wl}`, x, height - 8);
    }

    ctx.save();
    ctx.translate(10, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('相对强度', 0, 0);
    ctx.restore();

    ctx.fillStyle = 'rgba(224, 224, 224, 0.5)';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * (4 - i);
      ctx.fillText(`${(i / 4).toFixed(1)}`, padding.left - 5, y + 3);
    }
  }, [temperature, starColor]);

  return (
    <div className="spectrum-chart-container">
      <div className="spectrum-chart-title">光谱曲线</div>
      <canvas ref={canvasRef} className="spectrum-canvas" />
    </div>
  );
}

function wavelengthToRgbString(wavelength: number): string {
  let r = 0;
  let g = 0;
  let b = 0;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }

  let factor: number;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380);
  } else if (wavelength >= 420 && wavelength < 701) {
    factor = 1;
  } else if (wavelength >= 701 && wavelength <= 780) {
    factor = 0.3 + (0.7 * (780 - wavelength)) / (780 - 700);
  } else {
    factor = 0;
  }

  r = Math.round(Math.max(0, Math.min(255, r * factor * 255)));
  g = Math.round(Math.max(0, Math.min(255, g * factor * 255)));
  b = Math.round(Math.max(0, Math.min(255, b * factor * 255)));

  return `rgb(${r}, ${g}, ${b})`;
}
