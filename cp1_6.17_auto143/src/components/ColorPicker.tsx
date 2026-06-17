import { useEffect, useRef, useState } from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  size?: number;
}

export function ColorPicker({ value, onChange, size = 240 }: ColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [hexInput, setHexInput] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const { h, s, l } = hexToHsl(value);
    setHue(h);
    setSaturation(s);
    setLightness(l);
    setHexInput(value);
  }, [value]);

  function hexToHsl(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToHex(h: number, s: number, l: number) {
    const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l / 100 - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (h >= 300 && h < 360) {
      r = c;
      g = 0;
      b = x;
    }
    const toHex = (n: number) =>
      Math.round((n + m) * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const outerRadius = size / 2 - 4;
    const innerRadius = outerRadius - 20;

    for (let angle = 0; angle < 360; angle += 0.5) {
      const startAngle = (angle - 0.25) * (Math.PI / 180) - Math.PI / 2;
      const endAngle = (angle + 0.25) * (Math.PI / 180) - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(center, center, outerRadius, startAngle, endAngle);
      ctx.arc(center, center, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      const gradient = ctx.createRadialGradient(
        center,
        center,
        innerRadius,
        center,
        center,
        outerRadius
      );
      gradient.addColorStop(0, hslToHex(angle, 100, 70));
      gradient.addColorStop(1, hslToHex(angle, 100, 50));
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    const previewSize = innerRadius * 0.8;
    const previewX = center - previewSize / 2;
    const previewY = center - previewSize / 2;
    ctx.beginPath();
    ctx.arc(center, center, previewSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = hslToHex(hue, saturation, lightness);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const selectorAngle = hue * (Math.PI / 180) - Math.PI / 2;
    const selectorRadius = (outerRadius + innerRadius) / 2;
    const selectorX = center + Math.cos(selectorAngle) * selectorRadius;
    const selectorY = center + Math.sin(selectorAngle) * selectorRadius;
    ctx.beginPath();
    ctx.arc(selectorX, selectorY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [size, hue, saturation, lightness]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const dist = Math.sqrt(x * x + y * y);
    const outerRadius = size / 2 - 4;
    const innerRadius = outerRadius - 20;

    if (dist >= innerRadius && dist <= outerRadius) {
      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      const newHex = hslToHex(angle, saturation, lightness);
      setHue(angle);
      setHexInput(newHex);
      onChange(newHex);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const dist = Math.sqrt(x * x + y * y);
    const outerRadius = size / 2 - 4;
    const innerRadius = outerRadius - 20;

    if (dist >= innerRadius && dist <= outerRadius) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    const newHex = hslToHex(angle, saturation, lightness);
    setHue(angle);
    setHexInput(newHex);
    onChange(newHex);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const l = Number(e.target.value);
    setLightness(l);
    const newHex = hslToHex(hue, saturation, l);
    setHexInput(newHex);
    onChange(newHex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const { h, s, l } = hexToHsl(val);
      setHue(h);
      setSaturation(s);
      setLightness(l);
      onChange(val);
    }
  };

  return (
    <div className="color-picker">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, cursor: 'crosshair' }}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="color-picker__controls">
        <div className="color-picker__lightness">
          <label>明度</label>
          <input
            type="range"
            min="10"
            max="90"
            value={lightness}
            onChange={handleLightnessChange}
            style={{
              background: `linear-gradient(to right, ${hslToHex(hue, saturation, 10)}, ${hslToHex(hue, saturation, 90)})`,
            }}
          />
        </div>
        <div className="color-picker__hex">
          <label>HEX</label>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            maxLength={7}
          />
        </div>
      </div>
    </div>
  );
}
