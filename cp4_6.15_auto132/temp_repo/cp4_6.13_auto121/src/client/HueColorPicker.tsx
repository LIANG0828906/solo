import React, { useEffect, useRef, useState, useCallback } from 'react';

interface HSV {
  h: number;
  s: number;
  v: number;
}

interface HueColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  presetSwatches?: string[];
}

function hexToHsv(hex: string): HSV {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h: hue, s, v };
}

function hsvToHex({ h, s, v }: HSV): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (n: number) =>
    Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (n: number) =>
    Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

const DEFAULT_SWATCHES: Record<string, string[]> = {
  background: ['#F5E6C8', '#FFF8EC', '#EADDC0', '#F0E4D0', '#FAF1DE', '#E9D9B5', '#2A2A2A', '#1A1A1A'],
  text:       ['#1A1A1A', '#000000', '#3D2E1E', '#5C4033', '#8B4513', '#C23B22', '#2E5E3E', '#FFFFFF'],
  accent:     ['#C23B22', '#A12F1A', '#B8860B', '#8B6914', '#2E5E3E', '#2F4F4F', '#4B0082', '#DAA520'],
};

const HueColorPicker: React.FC<HueColorPickerProps> = ({
  label,
  value,
  onChange,
  presetSwatches,
}) => {
  const wheelRef = useRef<HTMLCanvasElement | null>(null);
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value || '#C23B22'));
  const [draggingWheel, setDraggingWheel] = useState(false);
  const [previewGradient, setPreviewGradient] = useState(
    `linear-gradient(90deg, ${hslToHex(hsv.h, 100, 50)}, #FFFFFF)`
  );

  const category =
    label.includes('背景') ? 'background' :
    label.includes('文字') ? 'text' : 'accent';
  const swatches = presetSwatches || DEFAULT_SWATCHES[category] || DEFAULT_SWATCHES.accent;

  useEffect(() => {
    setHsv(hexToHsv(value || '#C23B22'));
  }, [value]);

  useEffect(() => {
    const hex = hsvToHex(hsv);
    const start = hslToHex(hsv.h, 100, 50);
    setPreviewGradient(`linear-gradient(90deg, ${start}, ${hex})`);
  }, [hsv]);

  const drawWheel = useCallback((sv: HSV) => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2;

    ctx.clearRect(0, 0, w, h);

    for (let angle = 0; angle < 360; angle += 1) {
      const hue = angle;
      const start = { h: hue, s: 1, v: sv.v };
      const end = { h: hue, s: 0, v: sv.v };
      const grad = ctx.createLinearGradient(cx, cy,
        cx + Math.cos((angle - 90) * Math.PI / 180) * radius,
        cy + Math.sin((angle - 90) * Math.PI / 180) * radius
      );
      grad.addColorStop(0, hsvToHex(start));
      grad.addColorStop(1, hsvToHex(end));

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius + 0.5,
        (angle - 0.5 - 90) * Math.PI / 180,
        (angle + 0.5 - 90) * Math.PI / 180
      );
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  useEffect(() => {
    drawWheel(hsv);
  }, [hsv.v, drawWheel]);

  const pickerPosition = () => {
    const canvas = wheelRef.current;
    if (!canvas) return { left: 0, top: 0 };
    const r = (canvas.width / 2) - 2;
    const rad = (hsv.h - 90) * Math.PI / 180;
    const dist = hsv.s * r;
    return {
      left: (canvas.width / 2) + Math.cos(rad) * dist,
      top:  (canvas.height / 2) + Math.sin(rad) * dist,
    };
  };

  const handleWheelPick = (clientX: number, clientY: number) => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = px - cx;
    const dy = py - cy;
    const r = canvas.width / 2;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), r);
    const clampedDist = dist / r;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    if (angle >= 360) angle -= 360;
    setHsv((prev) => ({ ...prev, h: angle, s: clampedDist }));
  };

  const onWheelDown = (e: React.MouseEvent) => {
    setDraggingWheel(true);
    handleWheelPick(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!draggingWheel) return;
    const onMove = (e: MouseEvent) => handleWheelPick(e.clientX, e.clientY);
    const onUp = () => setDraggingWheel(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingWheel]);

  const pos = pickerPosition();
  const currentHex = hsvToHex(hsv);

  const lumStyle = {
    background: `linear-gradient(90deg, #000000 0%, ${hslToHex(hsv.h, 100, 50)} 50%, #FFFFFF 100%)`,
  };

  const lumValue = Math.round(hsv.v * 100);

  const handleLum = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10) / 100;
    setHsv((prev) => ({ ...prev, v }));
  };

  return (
    <div className="hue-wheel-wrap">
      <div className="slider-label">
        <span>{label}</span>
        <span
          className="slider-value"
          style={{ background: currentHex, color: hsv.v > 0.6 ? '#1A1A1A' : '#F5E6C8' }}
        >
          {currentHex}
        </span>
      </div>
      <div className="hue-wheel-layout">
        <div
          className="hue-sv-canvas"
          onMouseDown={onWheelDown}
          style={{ width: 140, height: 140 }}
        >
          <canvas ref={wheelRef} width={280} height={280} />
          <div
            className="hue-picker"
            style={{
              left: (pos.left / 280) * 140,
              top: (pos.top / 280) * 140,
              background: currentHex,
            }}
          />
        </div>
        <div className="value-slider-wrap">
          <div className="gradient-preview" style={{ background: previewGradient }} />
          <div className="slider-row">
            <div className="slider-label">
              <span style={{ fontSize: 12 }}>明度</span>
              <span className="slider-value">{lumValue}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={lumValue}
              onChange={handleLum}
              className="lum-slider"
              style={lumStyle}
            />
          </div>
        </div>
      </div>
      <div className="color-presets">
        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>预设:</span>
        <div className="preset-swatches">
          {swatches.map((sw) => (
            <div
              key={sw}
              className={`swatch ${sw.toUpperCase() === value.toUpperCase() ? 'selected' : ''}`}
              style={{ background: sw }}
              title={sw}
              onClick={() => {
                const newHsv = hexToHsv(sw);
                setHsv(newHsv);
              }}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        className="apply-color-btn"
        onClick={() => onChange(currentHex)}
      >
        ✓ 应用此颜色并重新渲染
      </button>
    </div>
  );
};

export default HueColorPicker;
